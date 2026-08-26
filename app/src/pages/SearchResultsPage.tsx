import { Link, useSearchParams } from "react-router-dom";
import content from "@/data/content/en/search-results.json";
import { parseSearchQuery } from "@/utils/searchQuery";

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const { location, page } = parseSearchQuery(searchParams);

  return (
    <div>
      <h1 className="display-flex flex-align-center">
        {content.heading.replace("{{location}}", location ?? content.all_locations)}
      </h1>

      <Link to="/" className="usa-button">
        Return to home
      </Link>

      <p>{content.page_label.replace("{{page}}", String(page))}</p>
    </div>
  );
}

export default SearchResultsPage;
