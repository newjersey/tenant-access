import { useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import { appliedFilters } from "@/components/SearchFilters/filterOptions";
import content from "@/data/content/en/search-results.json";
import type { FilterKey } from "@/utils/searchQuery";

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

export default AppliedFilters;
