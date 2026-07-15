import Icon from "@/components/Icon/Icon";
import content from "@/data/content/en/common.json";

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
                src="/images/nj_state_seal.png"
                alt="New Jersey State Seal"
              />
            </div>
            <div className="grid-col-fill">
              <a href="https://nj.gov" rel="noopener">
                {content.banner.title}
              </a>
            </div>
            <ul className="grid-col-auto display-flex flex-align-center">
              <li>
                <a href="https://nj.gov/governor/" rel="noopener">
                  {content.governor} • {content.ltGovernor}
                </a>
              </li>
              <li className="grid-col-auto">
                <a
                  className="display-flex flex-align-center"
                  href="https://nj.gov/subscribe/"
                  rel="noopener"
                >
                  <Icon icon="mail" size="3" class="nj-banner__mail-icon margin-right-05" />
                  {content.banner.cta}
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
