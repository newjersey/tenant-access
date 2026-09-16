import type { Listing } from "@/clients/listings";

type PhotoFields = Pick<Listing, "photoKeys" | "imageUrl">;

export function photoUrl(key: string): string {
  return `${import.meta.env.VITE_API_BASE_URL}/${key}`;
}

// fallback to legacy -- remove after full migration
export function listingImageUrl({ photoKeys, imageUrl }: PhotoFields): string | null {
  const primary = photoKeys?.[0];
  return primary ? photoUrl(primary) : imageUrl;
}
