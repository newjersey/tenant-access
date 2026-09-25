import { type RefObject, type SubmitEvent, useState } from "react";
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

export default SearchControls;
