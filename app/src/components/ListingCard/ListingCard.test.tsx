import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ListingCard from "@/components/ListingCard/ListingCard";
import content from "@/data/content/en/search-results.json";
import { makeListing } from "@/test/makeListing";

const renderCard = (listing = makeListing()) =>
  render(
    <ul>
      <ListingCard listing={listing} />
    </ul>,
  );

describe("ListingCard", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the rent, unit summary, and address", () => {
    renderCard();

    expect(screen.getByText("$1,200/month")).toBeInTheDocument();
    expect(screen.getByText("2 bed | 1 bath")).toBeInTheDocument();
    expect(screen.getByText("221 King Street, Clifton, NJ 08608")).toBeInTheDocument();
  });

  it("shows a rent range when the listing has one", () => {
    renderCard(makeListing({ rent: 1300, rentMax: 1600 }));

    expect(screen.getByText("$1,300-$1,600/month")).toBeInTheDocument();
  });

  it("substitutes wording when a listing has no rent", () => {
    renderCard(makeListing({ rent: null, rentMax: null }));

    expect(screen.getByText(content.rent_unavailable)).toBeInTheDocument();
  });

  it("omits the unit summary when there is nothing to summarize", () => {
    renderCard(makeListing({ bedrooms: null, bathrooms: null, unitType: null }));

    expect(screen.queryByText("2 bed | 1 bath")).not.toBeInTheDocument();
    expect(screen.getByText("221 King Street, Clifton, NJ 08608")).toBeInTheDocument();
  });

  it("makes the whole card a single link to the full listing", () => {
    renderCard(makeListing({ fullListingUrl: "https://example.gov/listing/7" }));

    const card = screen.getByRole("listitem");
    const links = within(card).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.gov/listing/7");
    expect(links[0]).toHaveAccessibleName("$1,200/month, 221 King Street, Clifton, NJ 08608");
  });

  it("for now, falls back to the legacy photo when s3 not available yet", () => {
    renderCard(makeListing({ imageUrl: "https://example.gov/photo.jpg" }));

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://example.gov/photo.jpg",
    );
  });

  it("serves the photo from our own bucket once the detail scrape has stored one", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://cdn.example.test");
    renderCard(
      makeListing({
        photoKeys: ["photos/1/900.jpg"],
        imageUrl: "https://www.myhousingsearch.com/WebFile?id=900",
      }),
    );

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://cdn.example.test/photos/1/900.jpg",
    );
  });

  it("substitutes a placeholder for a listing with no photo", () => {
    const { container } = renderCard(makeListing({ imageUrl: null }));

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector(".listing-card__img--empty")).toBeInTheDocument();
  });
});
