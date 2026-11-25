import { createHmac, timingSafeEqual } from "node:crypto";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as client from "openid-client";
import { corsHeaders, headerValue } from "./http-response.js";

const SCOPE = "openid email phone";
const SESSION_COOKIE = "session";
const SESSION_SECONDS = 8 * 60 * 60;
const LOGIN_SECONDS = 10 * 60;

interface Session {
  sub: string;
  email: string | null;
  expiresAt: number;
}

interface AuthSecrets {
  clientSecret: string;
  sessionSecret: string;
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

let cachedSecrets: Promise<AuthSecrets> | undefined;
let config: client.Configuration | undefined;

const secretsClient = new SecretsManagerClient();

const getSecrets = (): Promise<AuthSecrets> => {
  // For tests and the local dev server, not dev or production
  const { OIDC_CLIENT_SECRET, SESSION_SECRET } = process.env;
  if (OIDC_CLIENT_SECRET && SESSION_SECRET) {
    return Promise.resolve({ clientSecret: OIDC_CLIENT_SECRET, sessionSecret: SESSION_SECRET });
  }

  cachedSecrets ??= (async () => {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: requireEnv("AUTH_SECRET_ARN") }),
    );
    const secrets: Partial<AuthSecrets> = JSON.parse(response.SecretString ?? "{}");
    if (!secrets.clientSecret || !secrets.sessionSecret) {
      throw new Error("Auth secret needs both clientSecret and sessionSecret");
    }
    return secrets as AuthSecrets;
  })().catch((error) => {
    cachedSecrets = undefined;
    throw error;
  });
  return cachedSecrets;
};

// Lazy so a cold start doesn't pay for discovery until a request needs it
const getConfig = async (): Promise<client.Configuration> => {
  config ??= await client.discovery(
    new URL(requireEnv("OIDC_ISSUER")),
    requireEnv("OIDC_CLIENT_ID"),
    (await getSecrets()).clientSecret,
  );
  return config;
};

const sign = (payload: string, secret: string): string =>
  createHmac("sha256", secret).update(payload).digest("base64url");

const attachSignature = (data: Session, secret: string): string => {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
};

const checkSignature = <T>(value: string | undefined, secret: string): T | undefined => {
  const [payload, signature] = value?.split(".") ?? [];
  if (!payload || !signature) return undefined;
  const expected = Buffer.from(sign(payload, secret));
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
  const secure = requireEnv("APP_URL").startsWith("https:") ? "; Secure" : "";
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
  const codeVerifier = client.randomPKCECodeVerifier();
  const state = client.randomState();
  const nonce = client.randomNonce();
  const authorizationUrl = client.buildAuthorizationUrl(oidc, {
    redirect_uri: requireEnv("OIDC_REDIRECT_URI"),
    scope: SCOPE,
    code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    state,
    nonce,
  });
  // Persist these for verification in the callback
  return redirect(authorizationUrl.href, [
    cookie("code_verifier", codeVerifier, LOGIN_SECONDS),
    cookie("state", state, LOGIN_SECONDS),
    cookie("nonce", nonce, LOGIN_SECONDS),
  ]);
};

export const callback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const landing = `${requireEnv("APP_URL")}/listing-management`;
  const clearLogin = ["code_verifier", "state", "nonce"].map((name) => cookie(name, "", 0));
  const codeVerifier = readCookie(event, "code_verifier");
  const state = readCookie(event, "state");
  const nonce = readCookie(event, "nonce");
  if (!codeVerifier || !state || !nonce) return redirect(landing, clearLogin);

  // The token request's redirect_uri must match the registered one exactly, so rebuild from it
  const currentUrl = new URL(requireEnv("OIDC_REDIRECT_URI"));
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (value !== undefined) currentUrl.searchParams.set(key, value);
  }

  try {
    const tokens = await client.authorizationCodeGrant(await getConfig(), currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims) throw new Error("Token response had no ID token");

    const session: Session = {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
    };
    return redirect(landing, [
      ...clearLogin,
      cookie(SESSION_COOKIE, attachSignature(session, (await getSecrets()).sessionSecret), SESSION_SECONDS),
    ]);
  } catch (error) {
    console.error("Sign-in callback failed:", error);
    return redirect(landing, clearLogin);
  }
};

export const logout = async (): Promise<APIGatewayProxyResult> => {
  const endSessionUrl = client.buildEndSessionUrl(await getConfig(), {
    post_logout_redirect_uri: requireEnv("APP_URL"),
  });
  return redirect(endSessionUrl.href, [cookie(SESSION_COOKIE, "", 0)]);
};

export const session = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sessionSecret } = await getSecrets();
  const current = checkSignature<Session>(readCookie(event, SESSION_COOKIE), sessionSecret);
  const body =
    current && current.expiresAt > Date.now()
      ? { signedIn: true, email: current.email }
      : { signedIn: false };
  // The app calls this cross-origin (but same-site), with the session cookie
  const cors = corsHeaders(headerValue(event, "origin"));
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      ...cors,
      ...(cors["Access-Control-Allow-Origin"]
        ? { "Access-Control-Allow-Credentials": "true" }
        : {}),
    },
    body: JSON.stringify(body),
  };
};

const ROUTES: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
  "/auth/login": login,
  "/auth/callback": callback,
  "/auth/logout": logout,
  "/auth/session": session,
};

// One function serves every /auth route, so discovery and secrets are shared once warm
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const route = ROUTES[event.resource];
  return route ? route(event) : { statusCode: 404, body: "" };
};
