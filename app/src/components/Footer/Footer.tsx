import content from "@/data/content/en/common.json";
import "@newjersey/feedback-widget/feedback-widget.min.js";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "feedback-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const Footer = () => {
  return (
    <div className="usa-footer usa-footer--slim">
      <div className="grid-container usa-footer__return-to-top">
        <a href="#banner">{content.footer.returnToTop}</a>
      </div>

      <feedback-widget contact-link={content.footer.linkUrlContact}></feedback-widget>

      <div className="usa-footer__primary-section">
        <div className="usa-footer__primary-container grid-row">
          <div className="mobile-lg:grid-col-8">
            <nav className="usa-footer__nav" aria-label="Footer navigation">
              <ul className="grid-row grid-gap">
                <li className="mobile-lg:grid-col-6 desktop:grid-col-auto usa-footer__primary-content">
                  <a className="usa-footer__primary-link" href={content.footer.linkUrlAbout}>
                    {content.footer.linkTextAbout}
                  </a>
                </li>
                <li className="mobile-lg:grid-col-6 desktop:grid-col-auto usa-footer__primary-content">
                  <a className="usa-footer__primary-link" href={content.footer.linkUrlResources}>
                    {content.footer.linkTextResources}
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mobile-lg:grid-col-4">
            <address className="usa-footer__address">
              <div className="grid-row grid-gap">
                <div className="grid-col-auto mobile-lg:grid-col-12 desktop:grid-col-auto">
                  <div className="usa-footer__contact-info">
                    <a href={content.footer.linkUrlPhone}>{content.footer.linkTextPhone}</a>
                  </div>
                </div>
                <div className="grid-col-auto mobile-lg:grid-col-12 desktop:grid-col-auto">
                  <div className="usa-footer__contact-info">
                    <a href={content.footer.linkUrlContact}>{content.footer.linkTextContact}</a>
                  </div>
                </div>
              </div>
            </address>
          </div>
        </div>
      </div>

      <div className="usa-footer__secondary-section">
        <div className="grid-container">
          <div className="usa-footer__logo grid-row grid-gap-2">
            <div className="grid-col-auto">
              <img className="maxw-15" src="/images/njhmfa-logo.png" alt="NJHMF logo" />
            </div>
            <div className="grid-col-auto">
              <h3 className="usa-footer__logo-heading">{content.footer.agencyName}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
