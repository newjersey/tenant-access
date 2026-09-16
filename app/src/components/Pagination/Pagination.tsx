import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon/Icon";
import content from "@/data/content/en/common.json";
import { lastPageOf, paginationSlots } from "@/utils/pagination";

interface PaginationProps {
  page: number;
  total: number;
}

const labels = content.pagination;

function Pagination({ page, total }: PaginationProps) {
  const [searchParams] = useSearchParams();
  const lastPage = lastPageOf(total);

  if (lastPage <= 1) {
    return null;
  }

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(target));
    return `?${params}`;
  };

  return (
    <nav aria-label={labels.label} className="usa-pagination">
      <ul className="usa-pagination__list">
        {page > 1 && (
          <li className="usa-pagination__item usa-pagination__arrow">
            <Link
              to={hrefFor(page - 1)}
              className="usa-pagination__link usa-pagination__previous-page"
              aria-label={labels.previousPage}
            >
              <Icon icon="navigate_before" />
              <span className="usa-pagination__link-text">{labels.previous}</span>
            </Link>
          </li>
        )}

        {paginationSlots(page, total).map((slot) => {
          if (typeof slot !== "number") {
            return (
              <li
                key={slot}
                className="usa-pagination__item usa-pagination__overflow"
                role="presentation"
              >
                <span>...</span>
              </li>
            );
          }

          const isCurrent = slot === page;

          return (
            <li key={slot} className="usa-pagination__item usa-pagination__page-no">
              <Link
                to={hrefFor(slot)}
                className={`usa-pagination__button${isCurrent ? " usa-current" : ""}`}
                aria-label={labels.page.replace("{{page}}", String(slot))}
                aria-current={isCurrent ? "page" : undefined}
              >
                {slot}
              </Link>
            </li>
          );
        })}

        {page < lastPage && (
          <li className="usa-pagination__item usa-pagination__arrow">
            <Link
              to={hrefFor(page + 1)}
              className="usa-pagination__link usa-pagination__next-page"
              aria-label={labels.nextPage}
            >
              <span className="usa-pagination__link-text">{labels.next}</span>
              <Icon icon="navigate_next" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Pagination;
