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
