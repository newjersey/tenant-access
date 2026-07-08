import { Link } from "react-router-dom";
import content from "@/data/content/en/createlisting.json";

function CreateListingPage() {
  return (
    <div>
      <h1>{content.heading}</h1>
      <p>
        <Link to="/dashboard" className="usa-button usa-button--unstyled">
          {content.returnToDashboard}
        </Link>
      </p>
    </div>
  );
}

export default CreateListingPage;
