import { Link } from "react-router-dom";
import content from "../data/content/en/notfound.json";

function NotFoundPage() {
  return (
    <div>
      <h1 className="font-heading-xl margin-top-0 tablet:margin-bottom-0">{content.heading}</h1>
      <p className="usa-intro">{content.message}</p>
      <p>{content.message2}</p>
      <p>{content.message3}</p>
      <div className="margin-y-5">
        <ul className="usa-button-group">
          <li className="usa-button-group__item">
            <Link to="/" className="usa-button">
              {content.hometext}
            </Link>
          </li>
          <li className="usa-button-group__item">
            <Link to="/signin" className="usa-button usa-button--outline">
              {content.signintext}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NotFoundPage;
