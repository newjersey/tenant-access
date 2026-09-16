import { beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://api.example.test";

const fetchMock = vi.fn();

let searchListings: typeof import("./listings").searchListings;

describe("searchListings", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        listings: [],
        pagination: { page: 1, pageSize: 20, total: 0 },
      }),
    });

    // API_BASE_URL is read once at module load, so the env has to be set before the import.
    vi.resetModules();
    ({ searchListings } = await import("./listings"));
  });

  it("sends the page and omits a null location", async () => {
    await searchListings({ location: null, page: 2 });

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/listings/search?page=2`, {
      signal: undefined,
    });
  });

  it("percent-encodes a location rather than using a plus", async () => {
    await searchListings({ location: "Jersey City", page: 1 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/listings/search?page=1&location=Jersey%20City`);
  });

  it("passes the abort signal through", async () => {
    const controller = new AbortController();
    await searchListings({ location: null, page: 1 }, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
  });

  it("rejects on a non-2xx response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(searchListings({ location: null, page: 1 })).rejects.toThrow(
      "Search failed with status 500",
    );
  });

  it("rejects when the base URL is not configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.resetModules();
    ({ searchListings } = await import("./listings"));

    await expect(searchListings({ location: null, page: 1 })).rejects.toThrow(
      "VITE_API_BASE_URL is not set",
    );
  });
});
