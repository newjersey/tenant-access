import { type ChangeEvent, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  selectedValue,
} from "@/components/SearchFilters/filterOptions";
import content from "@/data/content/en/search-results.json";
import { FILTER_KEYS, type FilterKey } from "@/utils/searchQuery";

interface FiltersPanelProps {
  open: boolean;
  onClose: () => void;
}

function FiltersPanel({ open, onClose }: FiltersPanelProps) {
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

export default FiltersPanel;
