/**
 * Footer component for displaying the footer content
 */
const Footer = () => {
  return (
    <div className="usa-footer usa-footer--slim">
      <div className="grid-container usa-footer__return-to-top">
        <a href="#banner">Return to top</a>
      </div>

      <div className="usa-footer__primary-section">
        <div className="usa-footer__primary-container grid-row">
          <div className="mobile-lg:grid-col-8">
            <nav className="usa-footer__nav" aria-label="Footer navigation">
              <ul className="grid-row grid-gap">
                <li className="mobile-lg:grid-col-6 desktop:grid-col-auto usa-footer__primary-content">
                  <a
                    className="usa-footer__primary-link"
                    href="https://www.nj.gov/njhrc/about/about-njhrc"
                  >
                    About the NJHRC
                  </a>
                </li>
                <li className="mobile-lg:grid-col-6 desktop:grid-col-auto usa-footer__primary-content">
                  <a
                    className="usa-footer__primary-link"
                    href="https://nj.gov/dca/hmfa/about/pressreleases/index.shtml"
                  >
                    News
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
                    <a href="tel:+18774288844">1-877-428-8844</a>
                  </div>
                </div>
                <div className="grid-col-auto mobile-lg:grid-col-12 desktop:grid-col-auto">
                  <div className="usa-footer__contact-info">
                    <a href="https://www.nj.gov/dca/hmfa/about/contactus/index.shtml">Contact us</a>
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
              <img className="usa-footer__logo-img" src="./images/logo-img.jpg" alt="NJHMF logo" />
            </div>
            <div className="grid-col-auto">
              <h3 className="usa-footer__logo-heading">
                New Jersey Housing and Mortgage Finance Agency
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
