import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { oidc } = vi.hoisted(() => ({
  oidc: {
    discovery: vi.fn(async () => ({ issuer: "fake" })),
    randomPKCECodeVerifier: vi.fn(() => "verifier"),
    randomState: vi.fn(() => "state"),
    randomNonce: vi.fn(() => "nonce"),
    calculatePKCECodeChallenge: vi.fn(async () => "challenge"),
    buildAuthorizationUrl: vi.fn(() => new URL("https://idp.test/authorize")),
    authorizationCodeGrant: vi.fn(),
    buildEndSessionUrl: vi.fn(() => new URL("https://idp.test/logout")),
  },
}));

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("openid-client", () => oidc);

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: class {
    send = sendMock;
  },
  GetSecretValueCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

let auth: typeof import("./auth.js");

const makeEvent = (
  cookie?: string,
  query: Record<string, string> = {},
  headers: Record<string, string> = {},
) =>
  ({
    headers: { Cookie: cookie, ...headers },
    queryStringParameters: query,
  }) as unknown as APIGatewayProxyEvent;

const setCookies = (result: APIGatewayProxyResult) =>
  (result.multiValueHeaders?.["Set-Cookie"] ?? []) as string[];

const cookieValue = (result: APIGatewayProxyResult, name: string) =>
  setCookies(result)
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(";")[0];

// What the browser would send back after login sets its cookies
const loginCookies = (result: APIGatewayProxyResult) =>
  setCookies(result)
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

const sessionBody = async (cookie?: string) =>
  JSON.parse((await auth.session(makeEvent(cookie))).body);

const signIn = async (claims: Record<string, unknown> | undefined) => {
  oidc.authorizationCodeGrant.mockResolvedValue({ claims: () => claims });
  const cookies = loginCookies(await auth.login());
  return auth.callback(makeEvent(cookies, { code: "abc", state: "state" }));
};

describe("auth handlers", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("OIDC_ISSUER", "https://idp.test/");
    vi.stubEnv("OIDC_CLIENT_ID", "client");
    vi.stubEnv("OIDC_CLIENT_SECRET", "secret");
    vi.stubEnv("OIDC_REDIRECT_URI", "http://localhost:5173/auth/callback");
    vi.stubEnv("APP_URL", "http://localhost:5173");
    vi.stubEnv("SESSION_SECRET", "test-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://app.example.gov");
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    auth = await import("./auth.js");
  });

  it("redirects to the IdP with PKCE, state, and nonce, and remembers them in a cookie", async () => {
    const result = await auth.login();

    expect(result.statusCode).toBe(302);
    expect(result.headers?.Location).toBe("https://idp.test/authorize");
    expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(expect.anything(), {
      redirect_uri: "http://localhost:5173/auth/callback",
      scope: "openid email phone",
      code_challenge: "challenge",
      code_challenge_method: "S256",
      state: "state",
      nonce: "nonce",
    });
    expect(setCookies(result)).toEqual([
      "code_verifier=verifier; Path=/; HttpOnly; SameSite=Lax; Max-Age=600",
      "state=state; Path=/; HttpOnly; SameSite=Lax; Max-Age=600",
      "nonce=nonce; Path=/; HttpOnly; SameSite=Lax; Max-Age=600",
    ]);
  });

  it("discovers the IdP once across requests", async () => {
    await auth.login();
    await auth.login();

    expect(oidc.discovery).toHaveBeenCalledTimes(1);
    expect(oidc.discovery).toHaveBeenCalledWith(new URL("https://idp.test/"), "client", "secret");
  });

  it("marks cookies Secure when the app is served over https", async () => {
    vi.stubEnv("APP_URL", "https://example.gov");
    vi.stubEnv("OIDC_REDIRECT_URI", "https://api.example.gov/auth/callback");

    expect(setCookies(await auth.login())[0]).toMatch(/; Secure$/);
  });

  it("fails loudly when configuration is missing", async () => {
    vi.stubEnv("OIDC_ISSUER", "");

    await expect(auth.login()).rejects.toThrow("OIDC_ISSUER is not set");
  });

  it("exchanges the code and starts a session on callback", async () => {
    const result = await signIn({ sub: "user-1", email: "pat@example.com" });

    expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
      expect.anything(),
      new URL("http://localhost:5173/auth/callback?code=abc&state=state"),
      {
        pkceCodeVerifier: "verifier",
        expectedState: "state",
        expectedNonce: "nonce",
        idTokenExpected: true,
      },
    );
    expect(result.headers?.Location).toBe("http://localhost:5173/listing-management");
    expect(setCookies(result).slice(0, 3)).toEqual([
      "code_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      "state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      "nonce=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    ]);
    expect(await sessionBody(cookieValue(result, "session"))).toEqual({
      signedIn: true,
      email: "pat@example.com",
    });
  });

  it("stores a null email when the ID token has none", async () => {
    const result = await signIn({ sub: "user-1" });

    expect(await sessionBody(cookieValue(result, "session"))).toEqual({
      signedIn: true,
      email: null,
    });
  });

  it("does not start a session when the token response has no ID token", async () => {
    const result = await signIn(undefined);

    expect(cookieValue(result, "session")).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("does not start a session when the code exchange fails", async () => {
    oidc.authorizationCodeGrant.mockRejectedValue(new Error("state mismatch"));
    const cookies = loginCookies(await auth.login());
    const result = await auth.callback(makeEvent(cookies, { code: "abc", state: "other" }));

    expect(result.headers?.Location).toBe("http://localhost:5173/listing-management");
    expect(cookieValue(result, "session")).toBeUndefined();
  });

  it("ignores a callback with no pending login", async () => {
    const result = await auth.callback(makeEvent(undefined, { code: "abc" }));

    expect(result.headers?.Location).toBe("http://localhost:5173/listing-management");
    expect(oidc.authorizationCodeGrant).not.toHaveBeenCalled();
  });

  it("reports signed out with no, tampered, or expired session cookies", async () => {
    const session = cookieValue(await signIn({ sub: "user-1" }), "session") as string;
    const [name, value] = session.split("=");
    const [payload, signature] = value.split(".");
    const forged = Buffer.from(
      JSON.stringify({ sub: "x", email: "x@example.com", expiresAt: Date.now() + 60_000 }),
    ).toString("base64url");

    expect(await sessionBody()).toEqual({ signedIn: false });
    expect(await sessionBody(`${name}=${forged}.${signature}`)).toEqual({ signedIn: false });
    expect(await sessionBody(`${name}=${payload}`)).toEqual({ signedIn: false });

    vi.useFakeTimers({ now: Date.now() + 9 * 60 * 60 * 1000 });
    expect(await sessionBody(session)).toEqual({ signedIn: false });
    vi.useRealTimers();
  });

  it("clears the session and redirects to the IdP's end-session endpoint on logout", async () => {
    const result = await auth.logout();

    expect(oidc.buildEndSessionUrl).toHaveBeenCalledWith(expect.anything(), {
      post_logout_redirect_uri: "http://localhost:5173",
    });
    expect(result.headers?.Location).toBe("https://idp.test/logout");
    expect(setCookies(result)).toEqual(["session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"]);
  });

  it("never caches the session response", async () => {
    const result = await auth.session(makeEvent());

    expect(result.headers?.["Cache-Control"]).toBe("no-store");
  });

  it("lets allowed origins read the session with credentials", async () => {
    const allowed = await auth.session(
      makeEvent(undefined, {}, { origin: "https://app.example.gov" }),
    );
    const other = await auth.session(makeEvent(undefined, {}, { origin: "https://evil.example" }));

    expect(allowed.headers).toMatchObject({
      "Access-Control-Allow-Origin": "https://app.example.gov",
      "Access-Control-Allow-Credentials": "true",
    });
    expect(other.headers).not.toHaveProperty("Access-Control-Allow-Origin");
    expect(other.headers).not.toHaveProperty("Access-Control-Allow-Credentials");
  });

  it("dispatches each API Gateway resource to its route", async () => {
    const event = (resource: string) => ({ ...makeEvent(), resource }) as APIGatewayProxyEvent;

    expect((await auth.handler(event("/auth/login"))).statusCode).toBe(302);
    expect((await auth.handler(event("/auth/session"))).statusCode).toBe(200);
    expect((await auth.handler(event("/auth/elsewhere"))).statusCode).toBe(404);
  });

  describe("when deployed, without secrets in the environment", () => {
    beforeEach(() => {
      vi.stubEnv("OIDC_CLIENT_SECRET", "");
      vi.stubEnv("SESSION_SECRET", "");
      vi.stubEnv("AUTH_SECRET_ARN", "arn:aws:secretsmanager:us-east-1:123:secret:auth");
    });

    it("reads them from Secrets Manager once", async () => {
      sendMock.mockResolvedValue({
        SecretString: JSON.stringify({ clientSecret: "from-sm", sessionSecret: "signing-key" }),
      });

      await auth.login();
      await auth.session(makeEvent());

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].input).toEqual({
        SecretId: "arn:aws:secretsmanager:us-east-1:123:secret:auth",
      });
      expect(oidc.discovery).toHaveBeenCalledWith(expect.anything(), "client", "from-sm");
    });

    it("fails, then retries, while the client secret has not been filled in", async () => {
      sendMock.mockResolvedValueOnce({ SecretString: JSON.stringify({ sessionSecret: "key" }) });
      await expect(auth.session(makeEvent())).rejects.toThrow("clientSecret and sessionSecret");

      sendMock.mockResolvedValueOnce({});
      await expect(auth.session(makeEvent())).rejects.toThrow("clientSecret and sessionSecret");

      expect(sendMock).toHaveBeenCalledTimes(2);
    });
  });
});
