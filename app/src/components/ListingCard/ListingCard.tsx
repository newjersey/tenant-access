import type { Listing } from "@/clients/listings";
import Icon from "@/components/Icon/Icon";
import ListingCardFrame from "@/components/ListingCard/ListingCardFrame";
import content from "@/data/content/en/search-results.json";
import { formatAddress, formatRent, formatUnitSummary } from "@/utils/formatListing";
import { listingImageUrl } from "@/utils/listingPhotos";

function ListingCard({ listing }: { listing: Listing }) {
  const rent = formatRent(listing) ?? content.rent_unavailable;
  const unitSummary = formatUnitSummary(listing);
  const address = formatAddress(listing);
  const photo = listingImageUrl(listing);

  return (
    <ListingCardFrame
      media={
        photo ? (
          <img className="listing-card__img" src={photo} alt="" />
        ) : (
          <div className="listing-card__img listing-card__img--empty">
            <Icon icon="image" size="9" />
          </div>
        )
      }
      heading={
        <a
          className="listing-card__link"
          href={listing.fullListingUrl}
          aria-label={`${rent}, ${address}`}
          target="_blank"
          rel="noreferrer"
        >
          {rent}
        </a>
      }
    >
      {unitSummary && <p>{unitSummary}</p>}
      <p>{address}</p>
    </ListingCardFrame>
  );
}

export default ListingCard;
