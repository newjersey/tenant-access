// Runs the auth Lambda handlers locally. The app's Vite dev server proxies /auth/* here,
// so the session cookie is first-party on localhost.
import { randomBytes } from "node:crypto";
import { createServer, type OutgoingHttpHeaders } from "node:http";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { callback, login, logout, session } from "../src/lambda/auth.js";

const PORT = 3001;

process.env.APP_URL ??= "http://localhost:5173";
process.env.OIDC_REDIRECT_URI ??= `${process.env.APP_URL}/auth/callback`;
// A fresh secret per run means restarting this server signs everyone out
process.env.SESSION_SECRET ??= randomBytes(32).toString("base64url");

const routes: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
  "/auth/login": login,
  "/auth/callback": callback,
  "/auth/logout": logout,
  "/auth/session": session,
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const route = routes[url.pathname];
  if (!route) {
    response.writeHead(404).end();
    return;
  }

  const event = {
    headers: { cookie: request.headers.cookie },
    queryStringParameters: Object.fromEntries(url.searchParams),
  } as unknown as APIGatewayProxyEvent;

  try {
    const result = await route(event);
    const headers = { ...result.headers, ...result.multiValueHeaders } as OutgoingHttpHeaders;
    response.writeHead(result.statusCode, headers).end(result.body);
  } catch (error) {
    console.error(`${url.pathname} failed:`, error);
    response.writeHead(500).end();
  }
}).listen(PORT, () => {
  console.log(`Auth dev server listening on http://localhost:${PORT}`);
});
