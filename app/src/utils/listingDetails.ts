import type { DetailSections, DetailValue, Listing } from "@/clients/listings";

export interface Fact {
  label: string;
  value: DetailValue;
}

export interface DetailGroup {
  heading: string;
  facts: Fact[];
}

export interface ApplicationFee {
  amount: string;
  note: string | null;
}

export interface ListingDetailsView {
  availability: string | null;
  amenities: string[];
  languages: string[];
  incomeQualifications: string | null;
  ageQualifications: Fact[];
  petPolicy: string | null;
  smokingPolicy: string | null;
  features: string[];
  fireSafety: string[];
  leadSafety: string | null;
  utilities: string[];
  utilitiesIncluded: string[];
  accessibility: Fact[];
  accessibilityDetails: Fact[];
  leaseLength: string | null;
  yearBuilt: number | null;
  applicationFee: ApplicationFee | null;
  managerNotes: Fact[];
  email: string | null;
  website: string | null;
  schoolDistrict: string | null;
  additionalDetails: DetailGroup[];
}

// "Not Income Based" also contains "Income Based", so match whole values
const INCOME_BASED_RENT_TYPES = new Set(["Income Based Rent", "Median Income Based Rent"]);

// legacy values meaning the feature is missing or unknown, so it shouldn't get a checkmark
const ABSENT = new Set(["None", "No", "No Hookup", "Unknown", "Standard"]);

const LANGUAGE_AMENITY = /^Landlord can accept (.+)-language phone calls$/;

export const isIncomeBased = ({ rentType }: Pick<Listing, "rentType">): boolean =>
  rentType !== null && INCOME_BASED_RENT_TYPES.has(rentType);

const asText = (value: DetailValue | undefined): string | null => {
  if (value === undefined) return null;
  const text = Array.isArray(value) ? value.join(", ") : value;
  return text || null;
};

const known = (value: DetailValue | undefined): string | null => {
  const text = asText(value);
  return text === null || ABSENT.has(text) ? null : text;
};

const asList = (value: DetailValue | undefined): string[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

const toFacts = (rows: Record<string, DetailValue>): Fact[] =>
  Object.entries(rows).map(([label, value]) => ({ label, value }));

const withValues = (facts: { label: string; value: string | null }[]): Fact[] =>
  facts.flatMap(({ label, value }) => (value === null ? [] : [{ label, value }]));

// "Yes" rows read as the label alone, lists and "Other ..." rows as their items,
// and everything else as "Label (value)"
export function checklist(rows: Record<string, DetailValue>): string[] {
  return Object.entries(rows).flatMap(([label, value]) => {
    if (Array.isArray(value)) return value;
    if (ABSENT.has(value) || !value) return [];
    if (value === "Yes") return [label];
    if (label.startsWith("Other ")) return value.split(/\s*,\s*/);
    return [`${label} (${value})`];
  });
}

// Reading a row removes it, so whatever's left over goes in "Additional details"
function sectionReader(sections: DetailSections) {
  const unread: DetailSections = Object.fromEntries(
    Object.entries(sections).map(([heading, rows]) => [heading, { ...rows }]),
  );

  return {
    row(heading: string, label: string): DetailValue | undefined {
      const value = unread[heading]?.[label];
      delete unread[heading]?.[label];
      return value;
    },
    section(heading: string): Record<string, DetailValue> {
      const rows = unread[heading] ?? {};
      delete unread[heading];
      return rows;
    },
    leftovers(): DetailGroup[] {
      return Object.entries(unread)
        .map(([heading, rows]) => ({ heading, facts: toFacts(rows) }))
        .filter((group) => group.facts.length > 0);
    },
  };
}

export function parseApplicationFee(fee: string | null): ApplicationFee | null {
  if (!fee) return null;
  const match = fee.match(/^Application Fee:\s*(\$[\d,.]+)\s*(.*)$/i);
  return match ? { amount: match[1], note: match[2] || null } : { amount: fee, note: null };
}

export function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

// "609-664-2769 (5)" dials the main number; the trailing extension can't go in a tel: link
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/\s*\(\d{1,5}\)\s*$/, "").replace(/[^\d+]/g, "")}`;
}

export function listingDetails(listing: Listing): ListingDetailsView {
  const legacy = listing.legacyDetails;
  const read = sectionReader(legacy?.sections ?? {});

  // shown elsewhere on the page, or not useful to renters
  read.row("Specialized Information", "Listing ID");
  read.row("Safety", "Learn More");
  const contact = read.section("Contact");

  const schoolDistrict =
    asText(read.row("Basic Features", "School District")) ??
    asText(read.row("Basic Features", "Address-Based School District"));
  const otherFeatures = read.row("Basic Features", "Other Features");

  return {
    availability: legacy?.availability ?? null,
    amenities: listing.amenities.filter((amenity) => !LANGUAGE_AMENITY.test(amenity)),
    languages: listing.amenities.flatMap((amenity) => amenity.match(LANGUAGE_AMENITY)?.[1] ?? []),
    incomeQualifications: asText(
      read.row("Comments", "Qualifiers For Income Based Rent or Income Restriction"),
    ),
    ageQualifications: withValues([
      { label: "Seniors Only", value: known(read.row("Specialized Information", "Seniors Only")) },
      { label: "Minimum Age", value: asText(read.row("Specialized Information", "Minimum Age")) },
    ]),
    petPolicy: known(read.row("Basic Features", "Pets")),
    smokingPolicy: known(read.row("Basic Features", "Smoking")),
    features: checklist({
      ...read.section("Appliances"),
      ...(otherFeatures ? { "Other Features": otherFeatures } : {}),
    }),
    fireSafety: asList(read.row("Safety", "Fire Safety")),
    leadSafety: asText(read.row("Safety", "New Jersey Lead-safety Level")),
    utilities: checklist(read.section("Utilities")),
    utilitiesIncluded: legacy?.utilitiesIncluded ?? [],
    accessibility: toFacts(read.section("Accessibility")).filter((fact) => known(fact.value)),
    accessibilityDetails: toFacts({
      ...read.section("Kitchen & Bath Accessibility"),
      ...read.section("Parking and Entry"),
    }),
    leaseLength: legacy?.leaseLength ?? null,
    yearBuilt: legacy?.yearBuilt ?? null,
    applicationFee: parseApplicationFee(legacy?.applicationFee ?? null),
    managerNotes: withValues([
      {
        label: "Owner/Manager Comments",
        value: asText(read.row("Comments", "Owner/Manager Comments")),
      },
      { label: "Property Comments", value: asText(read.row("Comments", "Property Comments")) },
    ]),
    email: legacy?.email ?? null,
    website: asText(contact.Website) ?? listing.website,
    schoolDistrict,
    // must stay last, after every read above
    additionalDetails: read.leftovers(),
  };
}
