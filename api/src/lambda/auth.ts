import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as client from "openid-client";
import { headerValue } from "./http-response.js";

const SCOPE = "openid email phone";
const SESSION_COOKIE = "session";
const LOGIN_COOKIE = "oidc_login";
const SESSION_SECONDS = 8 * 60 * 60;
const LOGIN_SECONDS = 10 * 60;

interface PendingLogin {
  codeVerifier: string;
  state: string;
  nonce: string;
}

interface Session {
  sub: string;
  email: string | null;
  expiresAt: number;
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

let config: client.Configuration | undefined;

// Lazy so a cold start doesn't pay for discovery until a request needs it
const getConfig = async (): Promise<client.Configuration> => {
  config ??= await client.discovery(
    new URL(requireEnv("OIDC_ISSUER")),
    requireEnv("OIDC_CLIENT_ID"),
    requireEnv("OIDC_CLIENT_SECRET"),
  );
  return config;
};

const sign = (payload: string): string =>
  createHmac("sha256", requireEnv("SESSION_SECRET")).update(payload).digest("base64url");

const seal = (data: PendingLogin | Session): string => {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const unseal = <T>(value: string | undefined): T | undefined => {
  const [payload, signature] = value?.split(".") ?? [];
  if (!payload || !signature) return undefined;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
  return JSON.parse(Buffer.from(payload, "base64url").toString());
};

const readCookie = (event: APIGatewayProxyEvent, name: string): string | undefined => {
  for (const part of (headerValue(event, "cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
};

const cookie = (name: string, value: string, maxAge: number): string => {
  const secure = requireEnv("OIDC_REDIRECT_URI").startsWith("https:") ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
};

const redirect = (location: string, cookies: string[]): APIGatewayProxyResult => ({
  statusCode: 302,
  headers: { Location: location, "Cache-Control": "no-store" },
  multiValueHeaders: { "Set-Cookie": cookies },
  body: "",
});

export const login = async (): Promise<APIGatewayProxyResult> => {
  const oidc = await getConfig();
  const pending: PendingLogin = {
    codeVerifier: client.randomPKCECodeVerifier(),
    state: client.randomState(),
    nonce: client.randomNonce(),
  };
  const authorizationUrl = client.buildAuthorizationUrl(oidc, {
    redirect_uri: requireEnv("OIDC_REDIRECT_URI"),
    scope: SCOPE,
    code_challenge: await client.calculatePKCECodeChallenge(pending.codeVerifier),
    code_challenge_method: "S256",
    state: pending.state,
    nonce: pending.nonce,
  });
  return redirect(authorizationUrl.href, [cookie(LOGIN_COOKIE, seal(pending), LOGIN_SECONDS)]);
};

export const callback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const landing = `${requireEnv("APP_URL")}/listing-management`;
  const clearLogin = cookie(LOGIN_COOKIE, "", 0);
  const pending = unseal<PendingLogin>(readCookie(event, LOGIN_COOKIE));
  if (!pending) return redirect(landing, [clearLogin]);

  // The token request's redirect_uri must match the registered one exactly, so rebuild from it
  const currentUrl = new URL(requireEnv("OIDC_REDIRECT_URI"));
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (value !== undefined) currentUrl.searchParams.set(key, value);
  }

  try {
    const tokens = await client.authorizationCodeGrant(await getConfig(), currentUrl, {
      pkceCodeVerifier: pending.codeVerifier,
      expectedState: pending.state,
      expectedNonce: pending.nonce,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims) throw new Error("Token response had no ID token");

    const session: Session = {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
    };
    return redirect(landing, [clearLogin, cookie(SESSION_COOKIE, seal(session), SESSION_SECONDS)]);
  } catch (error) {
    console.error("Sign-in callback failed:", error);
    return redirect(landing, [clearLogin]);
  }
};

export const logout = async (): Promise<APIGatewayProxyResult> => {
  const endSessionUrl = client.buildEndSessionUrl(await getConfig(), {
    post_logout_redirect_uri: requireEnv("APP_URL"),
  });
  return redirect(endSessionUrl.href, [cookie(SESSION_COOKIE, "", 0)]);
};

export const session = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const current = unseal<Session>(readCookie(event, SESSION_COOKIE));
  const body =
    current && current.expiresAt > Date.now()
      ? { signedIn: true, email: current.email }
      : { signedIn: false };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
};
