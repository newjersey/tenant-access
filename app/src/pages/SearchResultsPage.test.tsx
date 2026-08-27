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
  fullListingUrl: "https://www.myhousingsearch.com/listing/1",
  rentType: null,
  depositRange: null,
  ...overrides,
});

const resolveWith = (listings: Listing[]) =>
  searchListingsMock.mockResolvedValue({
    success: true,
    listings,
    pagination: { page: 1, total: listings.length },
  });

const resolveWithTotal = (total: number, page: number) =>
  searchListingsMock.mockResolvedValue({
    success: true,
    listings: [makeListing()],
    pagination: { page, total },
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
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
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

  it("reports how many results were found", async () => {
    resolveWithTotal(41, 1);

    renderAt("/search");

    expect(await screen.findByText("Found 41 results")).toBeInTheDocument();
  });

  it("uses the singular when a lone listing matched", async () => {
    resolveWith([makeListing()]);

    renderAt("/search");

    expect(await screen.findByText("Found 1 result")).toBeInTheDocument();
  });

  it("hides pagination when everything fits on one page", async () => {
    resolveWithTotal(12, 1);

    renderAt("/search");

    expect(await screen.findByText("Found 12 results")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("renders a bounded pagination naming every page", async () => {
    resolveWithTotal(41, 2);

    renderAt("/search?page=2");

    expect(await screen.findByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 3" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 4" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
  });

  it("omits the previous arrow on the first page", async () => {
    resolveWithTotal(41, 1);

    renderAt("/search");

    expect(await screen.findByRole("link", { name: "Next page" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Previous page" })).not.toBeInTheDocument();
  });

  it("switches to unbounded pagination once the API stops counting", async () => {
    resolveWithTotal(1001, 1);

    renderAt("/search");

    expect(await screen.findByText("Found over 1,000 results")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 5" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 50" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("…");
  });

  it("keeps the unbounded layout deep into a capped range", async () => {
    resolveWithTotal(1001, 45);

    renderAt("/search?page=45");

    expect(await screen.findByRole("link", { name: "Page 46" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Page 50" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
  });

  it("carries the location through to every page link", async () => {
    resolveWithTotal(41, 1);

    renderAt("/search?location=Long+Branch");

    const nextPage = await screen.findByRole("link", { name: "Next page" });
    expect(nextPage).toHaveAttribute("href", "/search?location=Long+Branch&page=2");
  });

  it("makes the whole card a single link to the full listing", async () => {
    resolveWith([makeListing({ fullListingUrl: "https://example.gov/listing/7" })]);

    renderAt("/search");

    const card = await screen.findByRole("listitem");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.gov/listing/7");
    expect(links[0]).toHaveAccessibleName("$1,200/month, 221 King Street, Clifton, NJ 08608");
    expect(card).toContainElement(links[0]);
  });

  it("shows the photo when there is one", async () => {
    resolveWith([makeListing({ imageUrl: "https://example.gov/photo.jpg" })]);

    renderAt("/search");

    expect(await screen.findByText("$1,200/month")).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveAttribute("src", "https://example.gov/photo.jpg");
  });

  it("substitutes a placeholder for the listings with no photo", async () => {
    resolveWith([makeListing({ imageUrl: null })]);

    renderAt("/search");

    expect(await screen.findByText("$1,200/month")).toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(document.querySelector(".listing-card__img--empty")).toBeInTheDocument();
  });
});
