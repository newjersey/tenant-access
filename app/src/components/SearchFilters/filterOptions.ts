import content from "@/data/content/en/search-results.json";
import { FILTER_KEYS, type FilterKey, parseFilters } from "@/utils/searchQuery";

export interface FilterOption {
  value: string;
  label: string;
}

const MINIMUM_ROOM_OPTIONS: FilterOption[] = [1, 2, 3, 4, 5].map((count) => ({
  value: String(count),
  label: `${count}+`,
}));

export const BEDROOM_OPTIONS: FilterOption[] = [
  { value: "any", label: content.filter_any },
  { value: "studio", label: content.filter_studio },
  ...[1, 2, 3, 4].map((count) => ({ value: String(count), label: String(count) })),
  { value: "5+", label: "5+" },
];

export const BATHROOM_OPTIONS: FilterOption[] = [
  { value: "any", label: content.filter_any },
  ...MINIMUM_ROOM_OPTIONS,
];

export const FILTER_LABELS: Record<FilterKey, { label: string; options?: FilterOption[] }> = {
  bedrooms: { label: content.filter_bedrooms_short, options: BEDROOM_OPTIONS },
  bathrooms: { label: content.filter_bathrooms_short, options: BATHROOM_OPTIONS },
  senior: { label: content.filter_senior },
};

export function appliedFilters(params: URLSearchParams): { key: FilterKey; label: string }[] {
  const active = parseFilters(params);

  return FILTER_KEYS.flatMap((key) => {
    const value = active[key];
    if (!value) return [];

    const { label, options } = FILTER_LABELS[key];
    if (!options) return [{ key, label }];

    const option = options.find((choice) => choice.value === value);
    return option ? [{ key, label: `${label}: ${option.label}` }] : [];
  });
}

export const selectedValue = (options: FilterOption[], raw: string | null): string =>
  raw && options.some((option) => option.value === raw) ? raw : "any";
