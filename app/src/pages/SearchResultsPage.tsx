import { Link } from "react-router-dom";
import content from "@/data/content/en/search-results.json";

function SearchResultsPage() {
  return (
    <div>
      <h1 className="display-flex flex-align-center">{content.heading} Clifton, NJ</h1>

      <Link to="/" className="usa-button">
        Return to home
      </Link>

      <ul className="usa-collection">
        <li className="usa-collection__item">
          <img
            className="usa-collection__img"
            src="https://placehold.co/100x100"
            alt="100 x 100 placeholder"
          />
          <div className="usa-collection__body">
            <p className="usa-collection__heading">
              <Link to="/property/2">$1200/month</Link>
            </p>
            <ul className="usa-collection__meta" aria-label="More information">
              <li className="usa-collection__meta-item">2 bds | 1 ba | 864 sqft</li>
              <li className="usa-collection__meta-item">221 King Street, Clifton, NJ 08608</li>
              <li className="usa-collection__meta-item">914-693-6613</li>
            </ul>
          </div>
        </li>
        <li className="usa-collection__item">
          <div className="usa-collection__body">
            <p className="usa-collection__heading">
              <Link to="/property/3">$1300/month</Link>
            </p>
            <ul className="usa-collection__meta" aria-label="More information">
              <li className="usa-collection__meta-item">2 bds | 1 ba | 1000 sqft</li>
              <li className="usa-collection__meta-item">123 Sesame Street, Clifton, NJ 07102</li>
              <li className="usa-collection__meta-item">914-693-6613</li>
            </ul>
          </div>
        </li>
        <li className="usa-collection__item">
          <img
            className="usa-collection__img"
            src="https://placehold.co/100x100"
            alt="100 x 100 placeholder"
          />
          <div className="usa-collection__body">
            <p className="usa-collection__heading">
              <Link to="/property/1">$877/month</Link>
            </p>
            <ul className="usa-collection__meta" aria-label="More information">
              <li className="usa-collection__meta-item">1 bds | 1 ba | 680 sqft</li>
              <li className="usa-collection__meta-item">02 Shady Lane, Point Clifton, NJ 08340</li>
              <li className="usa-collection__meta-item">914-693-6613</li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  );
}

export default SearchResultsPage;
