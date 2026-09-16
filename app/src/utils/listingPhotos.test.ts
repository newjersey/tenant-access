import { afterEach, describe, expect, it, vi } from "vitest";
import { listingImageUrl, photoUrl } from "./listingPhotos";

const BASE_URL = "https://cdn.example.test";
const LEGACY_URL = "https://www.myhousingsearch.com/WebFile?id=900";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listing photos", () => {
  it("builds a URL for a key in our own bucket", () => {
    vi.stubEnv("VITE_API_BASE_URL", BASE_URL);

    expect(photoUrl("photos/7/900.jpg")).toBe(`${BASE_URL}/photos/7/900.jpg`);
  });

  it("prefers our first photo over the legacy site's", () => {
    vi.stubEnv("VITE_API_BASE_URL", BASE_URL);

    const photoKeys = ["photos/7/900.jpg", "photos/7/901.png"];
    expect(listingImageUrl({ photoKeys, imageUrl: LEGACY_URL })).toBe(
      `${BASE_URL}/photos/7/900.jpg`,
    );
  });

  it("falls back to the legacy URL until the detail scrape stores a photo", () => {
    expect(listingImageUrl({ photoKeys: [], imageUrl: LEGACY_URL })).toBe(LEGACY_URL);
  });

  it("has nothing to show when there is no photo anywhere", () => {
    expect(listingImageUrl({ photoKeys: [], imageUrl: null })).toBeNull();
  });
});
