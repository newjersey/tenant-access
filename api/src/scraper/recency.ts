export const ONLY_RECENT_DEFAULT = true; // except one time manually
export const RECENT_WINDOW_DAYS = 14; // tons of buffer even though this runs nightly
export const ONLY_RECENT_S3_METADATA_KEY = "only-recent";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isRecentlyUpdated(
  lastUpdated: string | null,
  scrapeDate: Date,
  windowDays = RECENT_WINDOW_DAYS,
): boolean {
  if (!lastUpdated) return false;
  const updatedAt = Date.parse(lastUpdated);
  if (Number.isNaN(updatedAt)) return false;
  return updatedAt >= scrapeDate.getTime() - windowDays * MS_PER_DAY;
}

export function readOnlyRecent(value: unknown): boolean {
  if (value === undefined) return ONLY_RECENT_DEFAULT;
  if (typeof value !== "boolean") {
    throw new Error(`onlyRecent must be a boolean, got ${JSON.stringify(value)}`);
  }
  return value;
}

export function encodeOnlyRecent(onlyRecent: boolean): Record<string, string> {
  return { [ONLY_RECENT_S3_METADATA_KEY]: String(onlyRecent) };
}

export function decodeOnlyRecent(metadata: Record<string, string> | undefined): boolean {
  const value = metadata?.[ONLY_RECENT_S3_METADATA_KEY];
  return value === undefined ? ONLY_RECENT_DEFAULT : value === "true";
}
