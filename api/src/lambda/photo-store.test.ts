import type { S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storePhotos } from "./photo-store.js";

const DETAIL_PAGE = "https://www.myhousingsearch.com/dbh/ViewUnit/1388803";
const PHOTOS = [
  "https://www.myhousingsearch.com/WebFile?id=3010129",
  "https://www.myhousingsearch.com/WebFile?id=3010132",
];

function response(status: number, contentType: string | null, bytes = 15_524) {
  return {
    ok: status < 400,
    status,
    statusText: status === 404 ? "Not Found" : "OK",
    headers: { get: () => contentType },
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  } as unknown as Response;
}

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn(async () => responses.shift() ?? response(200, "image/jpeg"));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// send needs a typed parameter, or send.mock.calls comes out as an empty tuple
type SentCommand = { input: Record<string, unknown> };

function stubS3() {
  const send = vi.fn(async (_command: SentCommand) => ({}));
  return { s3: { send } as unknown as S3Client, send };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("storePhotos", () => {
  it("uploads every photo under the listing's prefix, in slideshow order", async () => {
    stubFetch(response(200, "image/jpeg", 15_524), response(200, "image/jpeg", 10_622));
    const { s3, send } = stubS3();

    expect(await storePhotos(s3, "images", 1388803, PHOTOS)).toEqual([
      "photos/1388803/3010129.jpg",
      "photos/1388803/3010132.jpg",
    ]);

    expect(send.mock.calls.map(([command]) => command.input)).toEqual([
      {
        Bucket: "images",
        Key: "photos/1388803/3010129.jpg",
        Body: expect.objectContaining({ length: 15_524 }),
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      },
      {
        Bucket: "images",
        Key: "photos/1388803/3010132.jpg",
        Body: expect.objectContaining({ length: 10_622 }),
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      },
    ]);
  });

  it("sends the listing's own detail page as the referer WebFile insists on", async () => {
    const fetchMock = stubFetch();
    const { s3 } = stubS3();

    await storePhotos(s3, "images", 1388803, [PHOTOS[0]]);

    expect(fetchMock).toHaveBeenCalledWith(
      PHOTOS[0],
      expect.objectContaining({ headers: expect.objectContaining({ Referer: DETAIL_PAGE }) }),
    );
  });

  it("does nothing for a listing with no photos", async () => {
    const fetchMock = stubFetch();
    const { s3, send } = stubS3();

    expect(await storePhotos(s3, "images", 401275, [])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("names the key from the content type rather than assuming jpeg", async () => {
    stubFetch(response(200, "image/png"), response(200, "image/svg+xml; charset=utf-8"));
    const { s3 } = stubS3();

    expect(await storePhotos(s3, "images", 68240, PHOTOS)).toEqual([
      "photos/68240/3010129.png",
      "photos/68240/3010132.svg",
    ]);
  });

  it("throws when the origin refuses the photo", async () => {
    stubFetch(response(404, "text/html"));
    const { s3, send } = stubS3();

    await expect(storePhotos(s3, "images", 1388803, PHOTOS)).rejects.toThrow(
      "Photo fetch failed: 404 Not Found",
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("throws when a 200 turns out to be an error page rather than an image", async () => {
    stubFetch(response(200, "text/html"));
    const { s3 } = stubS3();

    await expect(storePhotos(s3, "images", 1388803, PHOTOS)).rejects.toThrow(
      "Expected an image from https://www.myhousingsearch.com/WebFile?id=3010129, got text/html",
    );
  });

  it("throws when a 200 arrives with no content type at all", async () => {
    stubFetch(response(200, null));
    const { s3 } = stubS3();
    await expect(storePhotos(s3, "images", 1388803, PHOTOS)).rejects.toThrow("got no content type");
  });

  it("throws on a photo url that carries no id to name the object after", async () => {
    stubFetch();
    const { s3 } = stubS3();

    await expect(
      storePhotos(s3, "images", 1388803, ["https://www.myhousingsearch.com/WebFile"]),
    ).rejects.toThrow("No id in photo url https://www.myhousingsearch.com/WebFile");
  });
});
