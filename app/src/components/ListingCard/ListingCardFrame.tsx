import type { ReactNode } from "react";

interface ListingCardFrameProps {
  media: ReactNode;
  heading: ReactNode;
  children: ReactNode;
}

function ListingCardFrame({ media, heading, children }: ListingCardFrameProps) {
  return (
    <li className="usa-card tablet:grid-col-6 listing-card">
      <div className="usa-card__container">
        <div className="usa-card__media">{media}</div>

        <div className="usa-card__header">
          <h2 className="usa-card__heading">{heading}</h2>
        </div>

        <div className="usa-card__body">{children}</div>
      </div>
    </li>
  );
}

export default ListingCardFrame;
