import type { RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import content from "@/data/content/en/search-results.json";

interface SearchControlsProps {
  location: string | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

function SearchControls({
  location,
  filtersOpen,
  onToggleFilters,
  toggleRef,
}: SearchControlsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const runSearch = (selected: string | undefined) => {
    if ((selected ?? null) === location) return; // don't re-run duplicate searches

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
          <label className="usa-label" htmlFor="search-location">
            {content.search_label}
          </label>
          <LocationComboBox
            id="search-location"
            defaultValue={location ?? undefined}
            onChange={runSearch}
          />

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

export default SearchControls;
