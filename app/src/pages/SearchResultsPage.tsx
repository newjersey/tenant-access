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
import Icon from "@/components/Icon/Icon";
import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import SearchResults from "@/components/SearchResults/SearchResults";
import content from "@/data/content/en/search-results.json";
import { useSearchListings } from "@/hooks/useSearchListings";
import { FILTER_KEYS, type FilterKey, parseSearchQuery } from "@/utils/searchQuery";

const MINIMUM_ROOM_OPTIONS = [1, 2, 3, 4, 5].map((count) => ({
  value: String(count),
  label: `${count}+`,
}));

const BEDROOM_OPTIONS = [
  { value: "any", label: content.filter_any },
  { value: "studio", label: content.filter_studio },
  ...[1, 2, 3, 4].map((count) => ({ value: String(count), label: String(count) })),
  { value: "5+", label: "5+" },
];

const BATHROOM_OPTIONS = [{ value: "any", label: content.filter_any }, ...MINIMUM_ROOM_OPTIONS];

const FILTER_LABELS: Record<
  FilterKey,
  { label: string; options: { value: string; label: string }[] }
> = {
  bedrooms: { label: content.filter_bedrooms, options: BEDROOM_OPTIONS },
  bathrooms: { label: content.filter_bathrooms, options: BATHROOM_OPTIONS },
};

function appliedFilters(params: URLSearchParams): { key: FilterKey; label: string }[] {
  return FILTER_KEYS.flatMap((key) => {
    const value = params.get(key);
    if (!value || value === "any") return [];

    const { label, options } = FILTER_LABELS[key];
    const option = options.find((choice) => choice.value === value);
    return option ? [{ key, label: `${label}: ${option.label}` }] : [];
  });
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

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    for (const key of FILTER_KEYS) {
      params.delete(key);
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

        <button
          type="button"
          className="usa-button usa-button--unstyled search-filters__clear"
          onClick={clearFilters}
        >
          {content.filters_clear}
        </button>
      </section>
    </>
  );
}

function AppliedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = appliedFilters(searchParams);

  if (applied.length === 0) return null;

  const removeFilter = (key: FilterKey) => () => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <div className="margin-bottom-2">
      <h2 id="applied-filters-heading" className="font-sans-sm margin-top-0 margin-bottom-1">
        {content.filters_applied}
      </h2>

      <ul className="usa-button-group applied-filters" aria-labelledby="applied-filters-heading">
        {applied.map(({ key, label }) => (
          <li className="usa-button-group__item" key={key}>
            <button
              type="button"
              className="usa-button button-tag"
              aria-label={content.filters_remove.replace("{{filter}}", label)}
              onClick={removeFilter(key)}
            >
              {label}
              <Icon icon="close" />
            </button>
          </li>
        ))}
      </ul>
    </div>
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
          <div className="grid-col-12 desktop:grid-col-4 search-layout__filters">
            <FiltersPanel open={filtersOpen} onClose={closeFilters} />
          </div>

          <div className="grid-col-12 desktop:grid-col-8 search-layout__results">
            <AppliedFilters />
            <SearchResults search={search} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;
