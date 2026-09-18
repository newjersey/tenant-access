import { Link } from "react-router-dom";
import content from "../data/content/en/notfound.json";

function NotFoundPage() {
  return (
    <div className="grid-container">
      <h1 className="font-heading-xl tablet:margin-bottom-0">{content.heading}</h1>
      <p className="usa-intro">{content.message}</p>
      <p>{content.message2}</p>
      <p>{content.message3}</p>
      <div className="margin-y-5">
        <Link to="/" className="usa-button">
          {content.hometext}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
