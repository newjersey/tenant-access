import { Link, useSearchParams } from "react-router-dom";
import Alert from "@/components/Alert/Alert";
import content from "@/data/content/en/search-results.json";
import { type SearchListingsState, useSearchListings } from "@/hooks/useSearchListings";
import { formatAddress, formatRent, formatUnitSummary } from "@/utils/formatListing";
import { parseSearchQuery } from "@/utils/searchQuery";

function SearchResults({ search }: { search: SearchListingsState }) {
  if (search.status === "loading") {
    return <p>{content.loading}</p>;
  }

  if (search.status === "error") {
    return <Alert type="error">{content.error}</Alert>;
  }

  if (search.listings.length === 0) {
    return <p>{content.no_results}</p>;
  }

  return (
    <ul className="usa-collection">
      {search.listings.map((listing) => {
        const rent = formatRent(listing);
        const unitSummary = formatUnitSummary(listing);

        return (
          <li key={listing.uid} className="usa-collection__item">
            {listing.imageUrl && (
              <img className="usa-collection__img" src={listing.imageUrl} alt="" />
            )}
            <div className="usa-collection__body">
              <p className="usa-collection__heading">
                <Link to={`/property/${listing.uid}`}>{rent ?? content.rent_unavailable}</Link>
              </p>
              <ul className="usa-collection__meta" aria-label={content.more_information}>
                {unitSummary && <li className="usa-collection__meta-item">{unitSummary}</li>}
                <li className="usa-collection__meta-item">{formatAddress(listing)}</li>
                {listing.phoneNumber && (
                  <li className="usa-collection__meta-item">{listing.phoneNumber}</li>
                )}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
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

      <p>{content.page_label.replace("{{page}}", String(page))}</p>

      <SearchResults search={search} />
    </div>
  );
}

export default SearchResultsPage;
