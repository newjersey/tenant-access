import { Link } from "react-router-dom";
import content from "@/data/content/en/home.json";
import cities from "@/data/locations/cities.json";
import { resolveSlug } from "@/utils/slugify";

function HomePage() {
  return (
    <div>
      <h1>{content.heading}</h1>

      {cities.counties.map((county) => {
        // If the town has a slug, use it; otherwise, generate a slug from the name
        const countySlug = resolveSlug(county);

        return (
          <details key={countySlug} className="padding-y-1">
            <summary className="font-heading-lg text-bold">{county.name}</summary>
            <div className="margin-top-2 padding-2 border-left-1 border-base-lighter">
              <Link to={`/search?county=${countySlug}`}>View all properties in {county.name}</Link>
              <ul className="usa-list">
                {county.towns.map((town) => {
                  const townSlug = resolveSlug(town);

                  return (
                    <li key={townSlug}>
                      <Link to={`/search?county=${countySlug}&town=${townSlug}`}>{town.name}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default HomePage;
