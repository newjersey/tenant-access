import {
  type ChangeEvent,
  type SubmitEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Listing } from "@/clients/listings";
import Alert from "@/components/Alert/Alert";
import Icon from "@/components/Icon/Icon";
import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import Pagination from "@/components/Pagination/Pagination";
import content from "@/data/content/en/search-results.json";
import { type SearchListingsState, useSearchListings } from "@/hooks/useSearchListings";
import { formatAddress, formatRent, formatUnitSummary } from "@/utils/formatListing";
import { listingImageUrl } from "@/utils/listingPhotos";
import { PAGE_SIZE, RESULT_CAP } from "@/utils/pagination";
import { type FilterKey, parseSearchQuery, parseSort } from "@/utils/searchQuery";

const numberFormat = new Intl.NumberFormat("en-US");

const MINIMUM_ROOM_OPTIONS = [1, 2, 3, 4, 5].map((count) => ({
  value: String(count),
  label: `${count}+`,
}));

const BEDROOM_OPTIONS = [
  { value: "any", label: content.filter_any },
  { value: "studio", label: content.filter_studio },
  ...MINIMUM_ROOM_OPTIONS,
];

const BATHROOM_OPTIONS = [{ value: "any", label: content.filter_any }, ...MINIMUM_ROOM_OPTIONS];

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

function ListingCard({ listing }: { listing: Listing }) {
  const rent = formatRent(listing) ?? content.rent_unavailable;
  const unitSummary = formatUnitSummary(listing);
  const address = formatAddress(listing);
  const photo = listingImageUrl(listing);

  return (
    <li className="usa-card tablet:grid-col-6 listing-card">
      <div className="usa-card__container">
        <div className="usa-card__media">
          {photo ? (
            <img className="listing-card__img" src={photo} alt="" />
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

const selectedValue = (options: { value: string }[], raw: string | null): string =>
  raw && options.some((option) => option.value === raw) ? raw : "any";

function FiltersPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = useRef<HTMLElement>(null);

  const changeFilter = (name: FilterKey) => (event: ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    if (event.target.value === "any") {
      params.delete(name);
    } else {
      params.set(name, event.target.value);
    }
    params.delete("page");
    setSearchParams(params);
  };

  useEffect(() => {
    if (!open) return;

    panel.current?.focus();
    document.body.classList.add("filters-drawer-open");

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("filters-drawer-open");
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="usa-overlay is-visible search-filters__overlay"
          aria-label={content.filters_close}
          onClick={onClose}
        />
      )}

      <section
        className={`search-filters${open ? " search-filters--open" : ""}`}
        id="search-filters"
        aria-labelledby="search-filters-heading"
        tabIndex={-1}
        ref={panel}
      >
        <h2 id="search-filters-heading" className="font-sans-md margin-top-0 margin-bottom-1">
          {content.filters_label}
        </h2>

        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-6">
            <label className="usa-label margin-top-0" htmlFor="filter-bedrooms">
              {content.filter_bedrooms}
            </label>
            <select
              className="usa-select"
              id="filter-bedrooms"
              name="bedrooms"
              value={selectedValue(BEDROOM_OPTIONS, searchParams.get("bedrooms"))}
              onChange={changeFilter("bedrooms")}
            >
              {BEDROOM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="tablet:grid-col-6">
            <label className="usa-label tablet:margin-top-0" htmlFor="filter-bathrooms">
              {content.filter_bathrooms}
            </label>
            <select
              className="usa-select"
              id="filter-bathrooms"
              name="bathrooms"
              value={selectedValue(BATHROOM_OPTIONS, searchParams.get("bathrooms"))}
              onChange={changeFilter("bathrooms")}
            >
              {BATHROOM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="usa-button width-full desktop:display-none search-filters__done"
          onClick={onClose}
        >
          {content.filters_done}
        </button>
      </section>
    </>
  );
}

function SearchControls({
  location,
  filtersOpen,
  onToggleFilters,
  toggleRef,
}: {
  location: string | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(location ?? undefined);

  const runSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (selected) {
      params.set("location", selected);
    } else {
      params.delete("location");
    }
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <div className="search-controls">
      <div className="grid-container">
        <Link to="/" className="usa-link display-inline-flex flex-align-center">
          <Icon icon="navigate_before" />
          {content.home}
        </Link>

        <h1>{content.heading}</h1>

        <search>
          <form className="usa-search usa-search--small" onSubmit={runSearch}>
            <label className="usa-sr-only" htmlFor="search-location">
              {content.search_label}
            </label>
            <LocationComboBox
              id="search-location"
              defaultValue={location ?? undefined}
              onChange={setSelected}
            />
            <button className="usa-button" type="submit" aria-label={content.search_button}>
              <Icon icon="search" class="usa-search__submit-icon" />
            </button>
          </form>

          <button
            type="button"
            ref={toggleRef}
            className="usa-button usa-button--outline margin-top-2 search-controls__filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="search-filters"
            onClick={onToggleFilters}
          >
            {content.filters_button}
          </button>
        </search>
      </div>
    </div>
  );
}

function SortSelect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));

  const changeSort = (event: ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", event.target.value);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <>
      <label className="usa-sr-only" htmlFor="sort-listings">
        {content.sort_label}
      </label>
      <select
        className="usa-select margin-bottom-2"
        id="sort-listings"
        name="sort"
        value={sort}
        onChange={changeSort}
      >
        <option value="updated">{content.sort_updated}</option>
        <option value="price_asc">{content.sort_price_asc}</option>
        <option value="price_desc">{content.sort_price_desc}</option>
      </select>
    </>
  );
}

function SearchResults({ search }: SearchResultsProps) {
  if (search.status === "loading") {
    return (
      <p role="status">
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
      <SortSelect />
      <p className="font-sans-md margin-bottom-3">{resultsLabel(page, total)}</p>

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
  const { location, page, sort, filters } = useMemo(
    () => parseSearchQuery(searchParams),
    [searchParams],
  );
  const search = useSearchListings({ location, page, sort, filters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterToggle = useRef<HTMLButtonElement>(null);

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    filterToggle.current?.focus();
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64em)");
    const closeOnDesktop = () => {
      if (desktop.matches) setFiltersOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div>
      <SearchControls
        key={location ?? ""}
        location={location}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        toggleRef={filterToggle}
      />

      <div className="grid-container">
        <div className="grid-row grid-gap">
          <div className="grid-col-12 desktop:grid-col-3 search-layout__filters">
            <FiltersPanel open={filtersOpen} onClose={closeFilters} />
          </div>

          <div className="grid-col-12 desktop:grid-col-9 search-layout__results">
            <SearchResults search={search} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;
