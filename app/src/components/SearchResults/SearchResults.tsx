import Alert from "@/components/Alert/Alert";
import ListingCard from "@/components/ListingCard/ListingCard";
import Pagination from "@/components/Pagination/Pagination";
import SortSelect from "@/components/SearchResults/SortSelect";
import content from "@/data/content/en/search-results.json";
import type { SearchListingsState } from "@/hooks/useSearchListings";
import { PAGE_SIZE, RESULT_CAP } from "@/utils/pagination";

const numberFormat = new Intl.NumberFormat("en-US");

const SKELETON_CARDS = 6;

function resultsLabel(page: number, total: number): string {
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  if (total >= RESULT_CAP) {
    return content.results_range_capped
      .replace("{{first}}", numberFormat.format(first))
      .replace("{{last}}", numberFormat.format(last));
  }

  return content.results_range
    .replace("{{first}}", numberFormat.format(first))
    .replace("{{last}}", numberFormat.format(last))
    .replace("{{total}}", numberFormat.format(total));
}

function SkeletonCard() {
  return (
    <li className="usa-card tablet:grid-col-6 listing-card">
      <div className="usa-card__container">
        <div className="usa-card__media">
          <div className="listing-card__img listing-card__img--empty skeleton-box" />
        </div>

        <div className="usa-card__header">
          <h2 className="usa-card__heading">
            <span className="skeleton-text">$0,000/month</span>
          </h2>
        </div>

        <div className="usa-card__body">
          <p>
            <span className="skeleton-text">0 bed, 0 bath</span>
          </p>
          <p>
            <span className="skeleton-text">000 Sample Street, Township</span>
          </p>
        </div>
      </div>
    </li>
  );
}

interface SearchResultsProps {
  search: SearchListingsState;
}

function SearchResults({ search }: SearchResultsProps) {
  if (search.status === "error") {
    return <Alert type="error">{content.error}</Alert>;
  }

  if (search.status === "ready" && search.listings.length === 0) {
    return <p>{content.no_results}</p>;
  }

  const loading = search.status === "loading";

  return (
    <>
      {loading ? (
        <p role="status" className="usa-sr-only">
          {content.loading}
        </p>
      ) : null}

      <SortSelect />

      <p className="font-sans-md margin-bottom-3" aria-hidden={loading || undefined}>
        {loading ? (
          <span className="skeleton-text">Results 0 - 00 of 000</span>
        ) : (
          resultsLabel(search.pagination.page, search.pagination.total)
        )}
      </p>

      <ul className="usa-card-group" aria-hidden={loading || undefined}>
        {loading
          ? Array.from({ length: SKELETON_CARDS }, (_, index) => <SkeletonCard key={index} />)
          : search.listings.map((listing) => <ListingCard key={listing.uid} listing={listing} />)}
      </ul>

      {loading ? null : (
        <Pagination page={search.pagination.page} total={search.pagination.total} />
      )}
    </>
  );
}

export default SearchResults;
