import content from "@/data/content/en/home.json";

function HomePage() {
  return (
    <>
    <section className="usa-hero">
      <div className="grid-container">
        <div className="usa-hero__callout">
          <h1 className="usa-hero__heading">{content.heading}</h1>
          <br/>
          {content.search_instructions}
            <form className="usa-form maxw-none ">
              <label htmlFor="input-type-text" className="usa-label ">
                {content.location}
              </label>
              <input id="input-type-text" name="input-type-text" type="text" className="usa-input  usa-input--xl">
              </input>
              <button className="usa-button">
                {content.search_rentals}
              </button>
            </form>
        </div>
      </div>
    </section>

    <section className="usa-section">
      <h2>{content.why}</h2>
      <p>{content.introduction}</p>
      <ul>
        <li>{content.filter}</li>
        <li>{content.many_units}</li>
        <li>{content.easy_browsing}</li>
      </ul>
      <button className="usa-button usa-button--outline">{content.view_all}</button>

    </section>
    </>
  );
}

export default HomePage;
