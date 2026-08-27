import { useSearchParams } from "react-router-dom";
import type { Listing } from "@/clients/listings";
import Alert from "@/components/Alert/Alert";
import Icon from "@/components/Icon/Icon";
import Pagination from "@/components/Pagination/Pagination";
import content from "@/data/content/en/search-results.json";
import { type SearchListingsState, useSearchListings } from "@/hooks/useSearchListings";
import { formatAddress, formatRent, formatUnitSummary } from "@/utils/formatListing";
import { RESULT_CAP } from "@/utils/pagination";
import { parseSearchQuery } from "@/utils/searchQuery";

const numberFormat = new Intl.NumberFormat("en-US");

function resultsLabel(total: number): string {
  if (total >= RESULT_CAP) {
    return content.results_found_capped.replace("{{count}}", numberFormat.format(RESULT_CAP - 1));
  }

  if (total === 1) {
    return content.results_found_one;
  }

  return content.results_found.replace("{{count}}", numberFormat.format(total));
}

interface SearchResultsProps {
  search: SearchListingsState;
}

function ListingCard({ listing }: { listing: Listing }) {
  const rent = formatRent(listing) ?? content.rent_unavailable;
  const unitSummary = formatUnitSummary(listing);
  const address = formatAddress(listing);

  return (
    <li className="usa-card tablet:grid-col-6 desktop:grid-col-4 listing-card">
      <div className="usa-card__container">
        <div className="usa-card__media">
          {listing.imageUrl ? (
            <img className="listing-card__img" src={listing.imageUrl} alt="" />
          ) : (
            <div className="listing-card__img listing-card__img--empty">
              <Icon icon="image" size="9" />
            </div>
          )}
        </div>

        <div className="usa-card__header">
          <h2 className="usa-card__heading">
            <a
              className="listing-card__link"
              href={listing.fullListingUrl ?? undefined}
              aria-label={`${rent}, ${address}`}
              target="_blank"
              rel="noreferrer"
            >
              {rent}
            </a>
          </h2>
        </div>

        <div className="usa-card__body">
          {unitSummary && <p>{unitSummary}</p>}
          <p>{address}</p>
        </div>
      </div>
    </li>
  );
}

function SearchResults({ search }: SearchResultsProps) {
  if (search.status === "loading") {
    return <p>{content.loading}</p>;
  }

  if (search.status === "error") {
    return <Alert type="error">{content.error}</Alert>;
  }

  if (search.listings.length === 0) {
    return <p>{content.no_results}</p>;
  }

  const { page, total } = search.pagination;

  return (
    <>
      <p>{resultsLabel(total)}</p>

      <ul className="usa-card-group">
        {search.listings.map((listing) => (
          <ListingCard key={listing.uid} listing={listing} />
        ))}
      </ul>

      <Pagination page={page} total={total} />
    </>
  );
}

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const { location, page } = parseSearchQuery(searchParams);
  const search = useSearchListings({ location, page });

  return (
    <div>
      <h1 className="display-flex flex-align-center">
        {content.heading.replace("{{location}}", location ?? content.all_locations)}
      </h1>

      <SearchResults search={search} />
    </div>
  );
}

export default SearchResultsPage;
