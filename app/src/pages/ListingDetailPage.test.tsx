import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import content from "@/data/content/en/listing-detail.json";
import { makeLegacyDetails } from "@/test/makeLegacyDetails";
import { makeListing } from "@/test/makeListing";
import ListingDetailPage from "./ListingDetailPage";

const { getListingMock } = vi.hoisted(() => ({ getListingMock: vi.fn() }));
vi.mock("@/clients/listings", () => ({ getListing: getListingMock }));

function SearchStub() {
  const location = useLocation();
  return <p>search page {location.search}</p>;
}

const renderAt = (entries: string[]) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/search" element={<SearchStub />} />
        <Route path="/listings/:uid" element={<ListingDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

const fullListing = makeListing({
  uid: 7,
  name: "Valor Pointe",
  rentType: "Income Based Rent",
  depositRange: "$750 - $3,300",
  amenities: ["Washer/Dryer"],
  legacyDetails: makeLegacyDetails(),
});

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getListingMock.mockResolvedValue(fullListing);
  });

  it("asks for the listing in the URL while announcing that it's loading", async () => {
    getListingMock.mockReturnValue(new Promise(() => {}));
    renderAt(["/listings/7"]);

    expect(screen.getByRole("status")).toHaveTextContent(content.loading);
    expect(getListingMock).toHaveBeenCalledWith("7", expect.any(AbortSignal));
  });

  it("shows the listing's summary", async () => {
    renderAt(["/listings/7"]);

    expect(await screen.findByRole("heading", { level: 1, name: "Valor Pointe" })).toBeVisible();
    expect(screen.getByText(content.income_based)).toBeInTheDocument();
    expect(screen.getAllByText("221 King Street, Clifton, NJ 08608")).toHaveLength(2);
    expect(screen.getByText("$1,200/month")).toBeInTheDocument();
    expect(screen.getByText("2 bed | 1 bath")).toBeInTheDocument();
    expect(screen.getByText("Waiting List")).toBeInTheDocument();
  });

  it("groups the details into the design's sections", async () => {
    renderAt(["/listings/7"]);

    await screen.findByRole("heading", { level: 1 });
    const sections = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual([
      content.eligibility,
      content.property_details,
      content.application_information,
      content.additional_details,
      content.contact_property,
      content.location,
    ]);
    expect(screen.getByText("$35")).toBeInTheDocument();
    expect(screen.getByText("Per Adult")).toBeInTheDocument();
    expect(screen.getByText("$750 - $3,300")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: content.hud_lead_guidelines })).toHaveAttribute(
      "href",
      content.hud_lead_guidelines_url,
    );
  });

  it("keeps the comprehensive accessibility list collapsed until asked", async () => {
    renderAt(["/listings/7"]);

    const toggle = await screen.findByRole("button", { name: content.accessibility_details });
    expect(screen.getByText("Roll-in Shower")).not.toBeVisible();

    await userEvent.click(toggle);

    expect(screen.getByText("Roll-in Shower")).toBeVisible();
  });

  it("links every way to reach the property", async () => {
    renderAt(["/listings/7"]);

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: "914-693-6613" })).toHaveAttribute(
      "href",
      "tel:9146936613",
    );
    expect(screen.getByRole("link", { name: "leasing@example.com" })).toHaveAttribute(
      "href",
      "mailto:leasing@example.com",
    );
    expect(screen.getByRole("link", { name: content.website })).toHaveAttribute(
      "href",
      "https://example.com/valor",
    );
    expect(screen.getByRole("link", { name: content.original_listing })).toHaveAttribute(
      "href",
      "https://www.myhousingsearch.com/listing/1",
    );
  });

  it("leaves out sections there's no data for", async () => {
    getListingMock.mockResolvedValue(makeListing({ legacyDetails: null, amenities: [] }));
    renderAt(["/listings/7"]);

    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("heading", { name: content.eligibility })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: content.application_information }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: content.website })).not.toBeInTheDocument();
    expect(screen.queryByText(content.income_based)).not.toBeInTheDocument();
  });

  it("explains that a missing or hidden listing isn't available", async () => {
    getListingMock.mockResolvedValue(null);
    renderAt(["/listings/7"]);

    expect(
      await screen.findByRole("heading", { level: 1, name: content.not_found_heading }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: content.browse })).toHaveAttribute("href", "/search");
  });

  it("shows an error when the listing can't be loaded", async () => {
    getListingMock.mockRejectedValue(new Error("network down"));
    renderAt(["/listings/7"]);

    expect(await screen.findByRole("alert")).toHaveTextContent(content.error);
  });

  it("links the breadcrumb home and marks the listing as the current page", async () => {
    renderAt(["/listings/7"]);

    await screen.findByRole("heading", { level: 1 });
    const breadcrumb = within(screen.getByRole("navigation", { name: content.breadcrumb_label }));
    expect(breadcrumb.getByRole("link", { name: content.home })).toHaveAttribute("href", "/");
    expect(breadcrumb.getByText("Valor Pointe").closest("li")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  // The mobile back link comes first, then the desktop breadcrumb's link
  describe.each([
    ["back link", 0],
    ["breadcrumb", 1],
  ])("the %s to All Listings", (_, index) => {
    const allListingsLink = () =>
      screen.getAllByRole("link", { name: content.all_listings })[index];

    it("goes back to the search the user came from, keeping its query", async () => {
      renderAt(["/search?location=Newark&page=2", "/listings/7"]);

      await screen.findByRole("heading", { level: 1 });
      await userEvent.click(allListingsLink());

      expect(screen.getByText("search page ?location=Newark&page=2")).toBeInTheDocument();
    });

    it("sends a visitor who opened the listing directly to a fresh search", async () => {
      renderAt(["/listings/7"]);

      await screen.findByRole("heading", { level: 1 });
      const back = allListingsLink();
      expect(back).toHaveAttribute("href", "/search");
      await userEvent.click(back);

      expect(screen.getByText("search page")).toBeInTheDocument();
    });
  });
});
