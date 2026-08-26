import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "@/clients/listings";
import content from "@/data/content/en/search-results.json";
import SearchResultsPage from "./SearchResultsPage";

const { searchListingsMock } = vi.hoisted(() => ({ searchListingsMock: vi.fn() }));

vi.mock("@/clients/listings", () => ({ searchListings: searchListingsMock }));

const makeListing = (overrides: Partial<Listing> = {}): Listing => ({
  uid: 1,
  name: "Sunrise Apartments",
  address: "221 King Street",
  city: "Clifton",
  state: "NJ",
  zipCode: "08608",
  rent: 1200,
  rentMax: null,
  bedrooms: 2,
  bathrooms: 1,
  unitType: null,
  imageId: null,
  imageUrl: null,
  phoneNumber: "914-693-6613",
  website: null,
  description: null,
  lastUpdated: null,
  isWaitlistOpen: true,
  amenities: [],
  contactName: null,
  contactOrganization: null,
  fullListingUrl: null,
  rentType: null,
  depositRange: null,
  ...overrides,
});

const resolveWith = (listings: Listing[]) =>
  searchListingsMock.mockResolvedValue({
    success: true,
    listings,
    pagination: { page: 1, pageSize: 20, total: listings.length },
  });

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchResultsPage />
    </MemoryRouter>,
  );

describe("SearchResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveWith([]);
  });

  it("asks the API for the location and page in the URL", async () => {
    renderAt("/search?location=Newark&page=3");

    expect(await screen.findByText(content.no_results)).toBeInTheDocument();
    expect(searchListingsMock).toHaveBeenCalledWith(
      { location: "Newark", page: 3 },
      expect.any(AbortSignal),
    );
  });

  it("renders the returned listings", async () => {
    resolveWith([
      makeListing(),
      makeListing({
        uid: 2,
        address: "123 Sesame Street",
        zipCode: "07102",
        rent: 1300,
        rentMax: 1600,
        bedrooms: null,
        phoneNumber: null,
      }),
    ]);

    renderAt("/search?location=Clifton");

    expect(await screen.findByText("$1,200/month")).toBeInTheDocument();
    expect(screen.getByText("$1,300-$1,600/month")).toBeInTheDocument();
    expect(screen.getByText("221 King Street, Clifton, NJ 08608")).toBeInTheDocument();
    expect(screen.getByText("2 bd | 1 ba")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2 + 5);
  });

  it("substitutes wording when a listing has no rent", async () => {
    resolveWith([makeListing({ rent: null, rentMax: null })]);

    renderAt("/search");

    expect(await screen.findByText(content.rent_unavailable)).toBeInTheDocument();
  });

  it("shows an alert when the request fails", async () => {
    searchListingsMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAt("/search");

    expect(await screen.findByRole("alert")).toHaveTextContent(content.error);
  });
});
