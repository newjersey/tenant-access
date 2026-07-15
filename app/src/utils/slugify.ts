/**
 * A place that can be linked to a filtered search. The slug is optional:
 * when absent, it is derived from the name so the data never has to carry one.
 */
export interface Sluggable {
  name: string;
  slug?: string;
}

/** Turn a display name into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Use an explicit slug when one is present, otherwise generate it from the name. */
export function resolveSlug(place: Sluggable): string {
  return place.slug ? place.slug : slugify(place.name);
}
