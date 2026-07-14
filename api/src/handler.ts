import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

/**
 * Placeholder Lambda handler. This is a starting point for the backend:
 * a Lambda that communicates with a PostgreSQL database.
 *
 * Next steps:
 * - Choose a Postgres client / query approach and add it as a dependency.
 * - Add connection handling suited to Lambda concurrency (e.g. RDS Proxy or a pooler).
 * - Define shared request/response types and import them from a shared workspace.
 * - Wire up deployment (SAM / CDK / Serverless / etc.) and a bundler (e.g. esbuild).
 */
export async function handler(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "api workspace placeholder" }),
  };
}
