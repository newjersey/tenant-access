import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { detailUrl } from "../scraper/detail-parser.js";
import { USER_AGENT } from "../scraper/source.js";

const FETCH_TIMEOUT_MS = 30_000;

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function extensionFor(contentType: string): string {
  const subtype = contentType.split(";")[0].trim().slice("image/".length);
  return subtype === "jpeg" ? "jpg" : subtype.replace(/\+.*$/, "");
}

// server requires a referer
async function fetchPhoto(photoUrl: string, referer: string) {
  const response = await fetch(photoUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, Accept: "image/*", Referer: referer },
  });

  if (!response.ok) {
    throw new Error(
      `Photo fetch failed: ${response.status} ${response.statusText} for ${photoUrl}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Expected an image from ${photoUrl}, got ${contentType || "no content type"}`);
  }

  return { body: new Uint8Array(await response.arrayBuffer()), contentType };
}

export async function storePhotos(
  s3: S3Client,
  bucket: string,
  uid: number,
  photoUrls: string[],
): Promise<string[]> {
  const referer = detailUrl(uid);
  const keys: string[] = [];
  let bytes = 0;

  for (const photoUrl of photoUrls) {
    const id = new URL(photoUrl).searchParams.get("id");
    if (!id) throw new Error(`No id in photo url ${photoUrl}`);

    const { body, contentType } = await fetchPhoto(photoUrl, referer);
    const key = `photos/${uid}/${id}.${extensionFor(contentType)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: CACHE_CONTROL,
      }),
    );

    keys.push(key);
    bytes += body.length;
  }

  console.log(`Stored ${keys.length} photo(s) for uid ${uid} (${bytes} bytes)`);
  return keys;
}
