import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import content from "@/data/content/en/listing-detail.json";

function BackLink() {
  const navigate = useNavigate();
  const location = useLocation();
  // "default" means the page was opened directly, so there's no search to go back to
  const cameFromApp = location.key !== "default";

  return (
    <Link
      to="/search"
      className="listing-detail__back"
      onClick={(event) => {
        if (cameFromApp) {
          event.preventDefault();
          void navigate(-1);
        }
      }}
    >
      <Icon icon="arrow_back" size="3" />
      {content.back}
    </Link>
  );
}

export default BackLink;
