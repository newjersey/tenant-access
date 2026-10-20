import type { Listing } from "@/clients/listings";
import Icon from "@/components/Icon/Icon";
import BackLink from "@/components/ListingDetail/BackLink";
import content from "@/data/content/en/listing-detail.json";
import results from "@/data/content/en/search-results.json";
import { formatAddress, formatRent, formatUnitSummary } from "@/utils/formatListing";
import { isIncomeBased } from "@/utils/listingDetails";
import { listingImageUrl } from "@/utils/listingPhotos";

interface ListingSummaryProps {
  listing: Listing;
  availability: string | null;
}

function ListingSummary({ listing, availability }: ListingSummaryProps) {
  const unitSummary = formatUnitSummary(listing);
  const photo = listingImageUrl(listing);

  return (
    <div className="bg-base-lightest">
      <div className="grid-container padding-y-4">
        <div className="margin-bottom-4">
          <BackLink />
        </div>

        {isIncomeBased(listing) && (
          <p className="margin-y-0">
            <span className="usa-tag bg-success-darker">{content.income_based}</span>
          </p>
        )}

        <h1 className="font-heading-2xl text-primary-darker margin-top-1 margin-bottom-1">
          {listing.name}
        </h1>
        <p className="font-sans-lg margin-top-0" translate="no">
          {formatAddress(listing)}
        </p>

        <p className="font-sans-xl text-bold margin-bottom-0">
          {formatRent(listing) ?? results.rent_unavailable}
        </p>
        {unitSummary && <p className="font-sans-md margin-top-1">{unitSummary}</p>}

        {availability && (
          <p className="listing-detail__availability">
            <Icon icon="calendar_today" size="3" class="text-success-darker" />
            {availability}
          </p>
        )}

        {photo && <img className="listing-detail__photo margin-top-3" src={photo} alt="" />}
      </div>
    </div>
  );
}

export default ListingSummary;
