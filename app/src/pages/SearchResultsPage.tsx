import { type SubmitEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import AppliedFilters from "@/components/SearchFilters/AppliedFilters";
import FiltersPanel from "@/components/SearchFilters/FiltersPanel";
import SearchResults from "@/components/SearchResults/SearchResults";
import content from "@/data/content/en/search-results.json";
import { useSearchListings } from "@/hooks/useSearchListings";
import { parseSearchQuery } from "@/utils/searchQuery";

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
