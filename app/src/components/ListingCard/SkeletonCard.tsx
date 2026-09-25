import ListingCardFrame from "@/components/ListingCard/ListingCardFrame";

function SkeletonCard() {
  return (
    <ListingCardFrame
      media={<div className="listing-card__img listing-card__img--empty skeleton-box" />}
      heading={<span className="skeleton-text">$0,000/month</span>}
    >
      <p>
        <span className="skeleton-text">0 bed, 0 bath</span>
      </p>
      <p>
        <span className="skeleton-text">000 Sample Street, Township</span>
      </p>
    </ListingCardFrame>
  );
}

export default SkeletonCard;
