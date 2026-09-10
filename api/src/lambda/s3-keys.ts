export function dateFromKey(key: string): string {
  const match = key.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) throw new Error(`No date found in key: ${key}`);
  return match[1];
}

export function scrapeDateFromKey(key: string): Date {
  return new Date(`${dateFromKey(key)}T00:00:00Z`);
}
