import { type SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import LocationSearch from "@/components/LocationSearch/LocationSearch";
import content from "@/data/content/en/home.json";
import { isNjZip } from "@/utils/searchQuery";

function HomePage() {
  const [location, setLocation] = useState<string | undefined>();
  const [zip, setZip] = useState("");
  const [nearby, setNearby] = useState(true);
  const navigate = useNavigate();

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (zip && !isNjZip(zip)) return;
    const params = [];
    if (location) params.push(`location=${encodeURIComponent(location)}`);
    if (zip) params.push(`zip=${zip}`);
    if (!nearby) params.push("nearby=false");
    void navigate(params.length > 0 ? `/search?${params.join("&")}` : "/search");
  };

  return (
    <>
      <section className="usa-hero">
        <div className="grid-container">
          <div className="usa-hero__callout">
            <h1 className="usa-hero__heading">{content.heading}</h1>
            <p>{content.search_instructions}</p>
            <form className="usa-form maxw-none" onSubmit={handleSearch}>
              <LocationSearch
                id="location"
                label={content.location}
                zip={zip}
                nearby={nearby}
                onLocationChange={setLocation}
                onZipChange={setZip}
                onNearbyChange={setNearby}
              />
              <button
                type="submit"
                className="usa-button display-inline-flex flex-align-center width-full"
              >
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
          <ul className="usa-icon-list margin-bottom-2 margin-top-2">
            <li className="usa-icon-list__item">
              <div className="usa-icon-list__icon text-green">
                <Icon icon="check" />
              </div>
              <div className="usa-icon-list__content">{content.many_units}</div>
            </li>
            <li className="usa-icon-list__item">
              <div className="usa-icon-list__icon text-green">
                <Icon icon="check" />
              </div>
              <div className="usa-icon-list__content">{content.filter}</div>
            </li>
            <li className="usa-icon-list__item">
              <div className="usa-icon-list__icon text-green">
                <Icon icon="check" />
              </div>
              <div className="usa-icon-list__content">{content.easy_browsing}</div>
            </li>
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
