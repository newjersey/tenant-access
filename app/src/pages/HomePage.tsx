import { type SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import content from "@/data/content/en/home.json";

function HomePage() {
  const [location, setLocation] = useState<string | undefined>();
  const navigate = useNavigate();

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void navigate(location ? `/search?location=${encodeURIComponent(location)}` : "/search");
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
              <LocationComboBox id="location" onChange={setLocation} />
              <button type="submit" className="usa-button display-inline-flex flex-align-center width-full">
                {content.search_rentals}
                <Icon icon="arrow_forward" class="margin-left-1" />
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
