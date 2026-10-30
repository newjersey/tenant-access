import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import content from "@/data/content/en/listing-detail.json";

function ListingBreadcrumb({ current }: { current?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromApp = location.key !== "default"; // "default" means the page was opened directly, so there's no search to go back to

  const backToSearch = (event: MouseEvent) => {
    if (cameFromApp) {
      event.preventDefault();
      void navigate(-1);
    }
  };

  return (
    <>
      <div className="desktop:display-none">
        <Link to="/search" className="listing-detail__back" onClick={backToSearch}>
          <Icon icon="arrow_back" size="3" />
          {content.all_listings}
        </Link>
      </div>

      <nav
        className="usa-breadcrumb listing-detail__breadcrumb display-none desktop:display-block"
        aria-label={content.breadcrumb_label}
      >
        <ol className="usa-breadcrumb__list">
          <li className="usa-breadcrumb__list-item">
            <Link to="/" className="usa-breadcrumb__link">
              <span>{content.home}</span>
            </Link>
          </li>
          <li className="usa-breadcrumb__list-item">
            <Link to="/search" className="usa-breadcrumb__link" onClick={backToSearch}>
              <span>{content.all_listings}</span>
            </Link>
          </li>
          {current && (
            <li className="usa-breadcrumb__list-item usa-current" aria-current="page">
              <span>{current}</span>
            </li>
          )}
        </ol>
      </nav>
    </>
  );
}

export default ListingBreadcrumb;
