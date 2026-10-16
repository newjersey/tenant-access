import { type RefObject, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import LocationSearch from "@/components/LocationSearch/LocationSearch";
import content from "@/data/content/en/search-results.json";
import { isNjZip, parseSearchQuery, withFilter } from "@/utils/searchQuery";

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
  const { zip, nearby } = parseSearchQuery(searchParams);
  const [zipDraft, setZipDraft] = useState(zip ?? ""); // "draft" is to not register change until complete
  const [appliedZip, setAppliedZip] = useState(zip);

  // Pick up a ZIP that changed in the URL some other way, e.g. back navigation
  if (zip !== appliedZip) {
    setAppliedZip(zip);
    setZipDraft(zip ?? "");
  }

  const runSearch = (selected: string | undefined) => {
    if ((selected ?? null) === location) return; // don't re-run duplicate searches

    const params = new URLSearchParams(searchParams);
     if (selected) {
      params.set("location", selected);
      params.delete("zip");
    } else {
      params.delete("location");
    }
    params.delete("page");
    setSearchParams(params);
  };

  // Only search once the ZIP is a complete NJ one or cleared, not on every keystroke
  const changeZip = (value: string) => {
    setZipDraft(value);
    if (value === (zip ?? "")) return;
    if (value === "" || isNjZip(value)) {
      setSearchParams((current) => {
        const params = withFilter(current, "zip", value);
        params.delete("location");
        return params;
      });
    }
  };

  const changeNearby = (checked: boolean) => {
    setSearchParams((current) => withFilter(current, "nearby", checked ? "" : "false"));
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
          <LocationSearch
            id="search-location"
            label={content.search_label}
            defaultLocation={location ?? undefined}
            zip={zipDraft}
            nearby={nearby ?? true}
            onLocationChange={runSearch}
            onZipChange={changeZip}
            onNearbyChange={changeNearby}
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
