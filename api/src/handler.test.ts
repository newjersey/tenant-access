import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { handler } from "./handler.js";

describe("handler", () => {
  it("should return placeholder response", async () => {
    const mockEvent = {} as APIGatewayProxyEventV2;

    const result = await handler(mockEvent);

    expect(result).toMatchObject({
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "api workspace placeholder" }),
    });
  });
});
