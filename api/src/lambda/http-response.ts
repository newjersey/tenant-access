import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const CACHE_SECONDS = 300;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const headerValue = (event: APIGatewayProxyEvent, name: string): string | undefined => {
  const headers = event.headers ?? {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? (headers[key] ?? undefined) : undefined;
};

export const respond = (
  statusCode: number,
  body: unknown,
  origin: string | undefined,
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": statusCode === 200 ? `public, max-age=${CACHE_SECONDS}` : "no-store",
    Vary: "Origin",
    ...(origin && ALLOWED_ORIGINS.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
  },
  body: JSON.stringify(body),
});
