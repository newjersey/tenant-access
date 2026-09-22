import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import content from "@/data/content/en/search-results.json";
import { parseSort } from "@/utils/searchQuery";

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
      <label htmlFor="sort-listings">{content.sort_label}</label>
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

export default SortSelect;
