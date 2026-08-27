import { Link, useSearchParams } from "react-router-dom";
import Alert from "@/components/Alert/Alert";
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
