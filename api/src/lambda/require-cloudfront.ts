import type { APIGatewayProxyEventV2 } from "aws-lambda";

export const isFromCloudFront = (event: APIGatewayProxyEventV2): boolean => {
  const expected = process.env.ORIGIN_SECRET;
  if (!expected) return false;
  return event.headers?.["x-origin-secret"] === expected;
};
