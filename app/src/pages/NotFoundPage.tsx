import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div>
      <h1 className="font-heading-xl margin-top-0 tablet:margin-bottom-0">Page not found</h1>
      <p className="usa-intro">
        We're sorry, we can't find the page you're looking for. It might have been removed, changed
        its name, or is otherwise unavailable.
      </p>
      <p>
        If you typed the URL directly, check your spelling and capitalization. Our URLs look like
        this: <strong>nj.gov/example-one</strong>.
      </p>
      <p>
        Visit our homepage for helpful tools and resources, or contact us and we'll point you in the
        right direction.
      </p>
      <div className="margin-y-5">
        <ul className="usa-button-group">
          <li className="usa-button-group__item">
            <Link to="/" className="usa-button">
              Visit homepage
            </Link>
          </li>
          <li className="usa-button-group__item">
            <Link to="/signin" className="usa-button usa-button--outline">
              Sign in
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NotFoundPage;
