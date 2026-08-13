import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./migration-runner.js";

const { getClientMock, queryMock, endMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  queryMock: vi.fn(),
  endMock: vi.fn(),
}));

vi.mock("./db.js", () => ({
  getClient: getClientMock,
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

const readFileSyncMock = vi.mocked(readFileSync);

describe("migration-runner handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    getClientMock.mockResolvedValue({ query: queryMock, end: endMock });
    queryMock.mockResolvedValue({ rowCount: 0 });
    endMock.mockResolvedValue(undefined);
    readFileSyncMock.mockReturnValue("CREATE TABLE listings ();");
  });

  it("reads the migration file and runs it, returning 200", async () => {
    const result = await handler({ migrationFile: "20260804110544_create_listings_table.sql" });

    expect(readFileSyncMock).toHaveBeenCalledWith(
      "/var/task/migrations/20260804110544_create_listings_table.sql",
      "utf-8",
    );
    expect(queryMock).toHaveBeenCalledWith("CREATE TABLE listings ();");
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        migration: "20260804110544_create_listings_table.sql",
        message: "Migration completed successfully",
      }),
    });
    expect(endMock).toHaveBeenCalledOnce();
  });

  it("returns a 500 with the message when the migration query fails", async () => {
    queryMock.mockRejectedValue(new Error('relation "listings" already exists'));

    const result = await handler({ migrationFile: "m.sql" });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      success: false,
      error: 'relation "listings" already exists',
    });
  });
});
