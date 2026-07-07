/**
 * Banner component for displaying important messages or announcements
 */
const Banner = () => {
  return (
    <section id="banner" className="nj-banner" aria-label="Official government website">
      <div className="nj-banner__header">
        <div className="grid-container">
          <div className="nj-banner__inner">
            <div className="grid-col-auto">
              <img
                className="nj-banner__header-seal"
                src="./images/nj_state_seal.png"
                alt="New Jersey State Seal"
              />
            </div>
            <div className="grid-col-fill">
              <a href="https://nj.gov" rel="noopener">
                Official Site of the State of New Jersey
              </a>
            </div>
            <ul className="grid-col-auto display-flex flex-align-center">
              <li>
                <a href="https://nj.gov/governor/" rel="noopener">
                  Governor Mikie Sherrill • Lt. Governor Dr. Dale G. Caldwell
                </a>
              </li>
              <li className="grid-col-auto">
                <a
                  className="display-flex flex-align-center"
                  href="https://nj.gov/subscribe/"
                  rel="noopener"
                >
                  <svg
                    className="usa-icon usa-icon--size-3 nj-banner__mail-icon margin-right-05"
                    role="img"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <use xlinkHref="./images/sprite.svg#mail"></use>
                  </svg>
                  Get Updates
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
