import Alert from "@/components/Alert/Alert";
import ListingCard from "@/components/ListingCard/ListingCard";
import Pagination from "@/components/Pagination/Pagination";
import SortSelect from "@/components/SearchResults/SortSelect";
import content from "@/data/content/en/search-results.json";
import type { SearchListingsState } from "@/hooks/useSearchListings";
import { PAGE_SIZE, RESULT_CAP } from "@/utils/pagination";

const numberFormat = new Intl.NumberFormat("en-US");

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

interface SearchResultsProps {
  search: SearchListingsState;
}

function SearchResults({ search }: SearchResultsProps) {
  if (search.status === "loading") {
    return (
      <p role="status" className="search-results__loading">
        <span className="loading-spinner" aria-hidden="true" />
        {content.loading}
      </p>
    );
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
      <p className="font-sans-md margin-bottom-3">{resultsLabel(page, total)}</p>

      <SortSelect />

      <ul className="usa-card-group">
        {search.listings.map((listing) => (
          <ListingCard key={listing.uid} listing={listing} />
        ))}
      </ul>

      <Pagination page={page} total={total} />
    </>
  );
}

export default SearchResults;
