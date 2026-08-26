import type { Listing } from "@/clients/listings";

type RentFields = Pick<Listing, "rent" | "rentMax">;
type UnitFields = Pick<Listing, "bedrooms" | "bathrooms">;
type AddressFields = Pick<Listing, "address" | "city" | "state" | "zipCode">;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Render rent as a single figure or a range. Returns null when the scrape captured no rent at all,
 * so the caller can substitute its own wording.
 */
export function formatRent({ rent, rentMax }: RentFields): string | null {
  if (rent === null) {
    return rentMax === null ? null : `Up to ${currency.format(rentMax)}/month`;
  }

  if (rentMax === null || rentMax <= rent) {
    return `${currency.format(rent)}/month`;
  }

  return `${currency.format(rent)}-${currency.format(rentMax)}/month`;
}

/** Summarise bedrooms and bathrooms, skipping whichever the scrape did not provide. */
export function formatUnitSummary({ bedrooms, bathrooms }: UnitFields): string | null {
  const parts = [
    bedrooms === null ? null : `${bedrooms} bd`,
    bathrooms === null ? null : `${bathrooms} ba`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}

/** Single-line address for display. */
export function formatAddress({ address, city, state, zipCode }: AddressFields): string {
  return `${address}, ${city}, ${state} ${zipCode}`;
}
