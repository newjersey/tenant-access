import content from "@/data/content/en/common.json";

const Identifier = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="usa-identifier">
      <section
        className="usa-identifier__section usa-identifier__section--masthead"
        aria-label="Agency identifier"
      >
        <div className="usa-identifier__container">
          <div className="usa-identifier__logos">
            <a href={content.govUrl} className="usa-identifier__logo">
              <img
                className="usa-identifier__logo-img"
                src="/images/nj-logo-gray-20.png"
                alt="the State of New Jersey logo"
              />
            </a>
          </div>

          <div className="usa-identifier__identity">
            <p className="usa-identifier__identity-disclaimer">
              {content.identifier.officialWebsite} <a href={content.govUrl}>{content.stateName}</a>.
            </p>
          </div>
        </div>
      </section>
      <nav className="usa-identifier__section usa-identifier__section--required-links">
        <div className="usa-identifier__container">
          <ul className="usa-identifier__required-links-list">
            <li className="usa-identifier__required-links-item">
              <a href={content.govAboutUrl} className="usa-identifier__required-link">
                {content.governor}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a href={content.govLtAboutUrl} className="usa-identifier__required-link">
                {content.ltGovernor}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a href={content.govUrl} className="usa-identifier__required-link usa-link">
                {content.identifier.njhome}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.servicesUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.services}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.departmentsUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.departments}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.faqsUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.faqs}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.contactUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.contact}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.privacyUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.privacy}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.legalUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.legal}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.accessibilityUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.accessibility}
              </a>
            </li>
            <li className="usa-identifier__required-links-item">
              <a
                href={content.identifier.opraUrl}
                className="usa-identifier__required-link usa-link"
              >
                {content.identifier.opra}
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <section className="usa-identifier__section usa-identifier__section--usagov">
        <div className="usa-identifier__container">
          <div className="usa-identifier__usagov-description">
            &copy; {currentYear} {content.stateName}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Identifier;
