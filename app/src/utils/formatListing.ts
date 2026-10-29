import type { Listing } from "@/clients/listings";
import content from "@/data/content/en/search-results.json";

type RentFields = Pick<Listing, "rent" | "rentMax">;
type UnitFields = Pick<Listing, "bedrooms" | "bathrooms" | "unitType">;
type AddressFields = Pick<Listing, "address" | "city" | "state" | "zipCode">;

const NOT_STUDIO = new Set([
  "Assisted Living Facility",
  "Group Home",
  "Shared Housing/Room to Rent",
  "Single Room Occupancy",
]);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatDollars = (amount: number): string => currency.format(amount);

export function formatRent({ rent, rentMax }: RentFields): string | null {
  if (rent === null) {
    return rentMax === null ? null : `Up to ${currency.format(rentMax)}/month`;
  }

  if (rentMax === null || rentMax <= rent) {
    return `${formatDollars(rent)}/month`;
  }

  return `${formatDollars(rent)}-${formatDollars(rentMax)}/month`;
}

function formatCount(value: number | null): string | null {
  const count = Number(value);
  return value === null || !Number.isFinite(count) ? null : count.toString();
}

function formatBedrooms(bedrooms: number | null, unitType: string | null): string | null {
  const count = formatCount(bedrooms);
  if (count === null) {
    return null;
  }

  if (count !== "0") {
    return `${count} ${content.bed}`;
  }

  return unitType && NOT_STUDIO.has(unitType) ? unitType : content.studio;
}

export function formatUnitSummary({ bedrooms, bathrooms, unitType }: UnitFields): string | null {
  const baths = formatCount(bathrooms);
  const parts = [
    formatBedrooms(bedrooms, unitType),
    baths === null ? null : `${baths} ${content.bath}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function formatAddress({ address, city, state, zipCode }: AddressFields): string {
  const region = [state, zipCode].filter(Boolean).join(" ");
  return [address, city, region].filter(Boolean).join(", ");
}

const SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);
const KEEP_UPPERCASE = /^(i{1,3}|iv|vi{0,3}|ix|llc|lp|nj|us|ymca)$/;

function normalizeTitleCase(text: string): string {
  if (/[a-z]/.test(text) && /[A-Z]/.test(text)) {
    return text;
  }

  return text
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      if (KEEP_UPPERCASE.test(word)) return word.toUpperCase();
      return word.replace(/(^|[-/(])([a-z])/g, (_, before, letter) => before + letter.toUpperCase());
    })
    .join(" ");
}

const PLACEHOLDER_NAME = /^(n\/?a|none)$/i;
export function formatListingName({ name, address }: Pick<Listing, "name" | "address">): string {
  const usable = /[a-z]/i.test(name) && !PLACEHOLDER_NAME.test(name.trim());
  return normalizeTitleCase(usable ? name : address);
}
