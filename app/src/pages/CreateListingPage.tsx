import { Link } from "react-router-dom";

function CreateListingPage() {
  return (
    <div>
      <h1>Create new listing</h1>
      <p>
        <Link to="/dashboard" className="usa-button usa-button--unstyled">
          Return to dashboard
        </Link>
      </p>
    </div>
  );
}

export default CreateListingPage;
