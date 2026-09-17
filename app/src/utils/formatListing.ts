import type { Listing } from "@/clients/listings";
import content from "@/data/content/en/search-results.json";

type RentFields = Pick<Listing, "rent" | "rentMax">;
type UnitFields = Pick<Listing, "bedrooms" | "bathrooms">;
type AddressFields = Pick<Listing, "address" | "city" | "state" | "zipCode">;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatRent({ rent, rentMax }: RentFields): string | null {
  if (rent === null) {
    return rentMax === null ? null : `Up to ${currency.format(rentMax)}/month`;
  }

  if (rentMax === null || rentMax <= rent) {
    return `${currency.format(rent)}/month`;
  }

  return `${currency.format(rent)}-${currency.format(rentMax)}/month`;
}

function formatCount(value: number | null): string | null {
  const count = Number(value);
  return value === null || !Number.isFinite(count) ? null : count.toString();
}

function formatBedrooms(bedrooms: number | null): string | null {
  const count = formatCount(bedrooms);
  if (count === null) {
    return null;
  }

  return count === "0" ? content.studio : `${count} ${content.bed}`;
}

export function formatUnitSummary({ bedrooms, bathrooms }: UnitFields): string | null {
  const baths = formatCount(bathrooms);
  const parts = [
    formatBedrooms(bedrooms),
    baths === null ? null : `${baths} ${content.bath}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function formatAddress({ address, city, state, zipCode }: AddressFields): string {
  const region = [state, zipCode].filter(Boolean).join(" ");
  return [address, city, region].filter(Boolean).join(", ");
}
