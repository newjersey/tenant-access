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

export function formatUnitSummary({ bedrooms, bathrooms }: UnitFields): string | null {
  const parts = [
    bedrooms === null ? null : `${bedrooms} ${content.bed}`,
    bathrooms === null ? null : `${bathrooms} ${content.bath}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}

export function formatAddress({ address, city, state, zipCode }: AddressFields): string {
  const region = [state, zipCode].filter(Boolean).join(" ");
  return [address, city, region].filter(Boolean).join(", ");
}
