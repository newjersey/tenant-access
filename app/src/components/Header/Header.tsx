import { Link } from "react-router-dom";
import "@/components/Header/Header.css";
import content from "@/data/content/en/common.json";

const Header = () => {
  return (
    <header className="usa-header usa-header--basic">
      <div className="usa-nav-container">
        <div className="usa-navbar njhmf-navbar">
          <div className="usa-logo" id="basic-logo">
            <em className="usa-logo__text">
              <Link to="/" className="display-flex flex-align-center">
                <img className="njhmf-logo" src="/images/logo-img.jpg" alt="NJHMF logo" />
                {content.header.appName}
              </Link>
            </em>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
