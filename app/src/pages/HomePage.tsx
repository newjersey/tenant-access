import { type SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import content from "@/data/content/en/home.json";

function HomePage() {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = location.trim();
    void navigate(term ? `/search?location=${encodeURIComponent(term)}` : "/search");
  };

  return (
    <>
      <section className="usa-hero">
        <div className="grid-container">
          <div className="usa-hero__callout">
            <h1 className="usa-hero__heading">{content.heading}</h1>
            <p>{content.search_instructions}</p>
            <form className="usa-form maxw-none" onSubmit={handleSearch}>
              <label htmlFor="location" className="usa-label">
                {content.location}
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="usa-input usa-input--xl"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
              <button type="submit" className="usa-button">
                {content.search_rentals}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="usa-section">
        <div className="grid-container">
          <h2>{content.why}</h2>
          <p>{content.introduction}</p>
          <ul>
            <li>{content.filter}</li>
            <li>{content.many_units}</li>
            <li>{content.easy_browsing}</li>
          </ul>
          <Link to="/search" className="usa-button usa-button--outline">
            {content.view_all}
          </Link>
        </div>
      </section>
    </>
  );
}

export default HomePage;
