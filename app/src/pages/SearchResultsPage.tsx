import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchControls from "@/components/SearchControls/SearchControls";
import AppliedFilters from "@/components/SearchFilters/AppliedFilters";
import FiltersPanel from "@/components/SearchFilters/FiltersPanel";
import SearchResults from "@/components/SearchResults/SearchResults";
import { useSearchListings } from "@/hooks/useSearchListings";
import { parseSearchQuery } from "@/utils/searchQuery";

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
