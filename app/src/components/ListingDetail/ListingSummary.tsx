import type { Listing } from "@/clients/listings";
import Icon from "@/components/Icon/Icon";
import ListingBreadcrumb from "@/components/ListingDetail/ListingBreadcrumb";
import content from "@/data/content/en/listing-detail.json";
import results from "@/data/content/en/search-results.json";
import {
  formatAddress,
  formatListingName,
  formatRent,
  formatUnitSummary,
} from "@/utils/formatListing";
import { isIncomeBased } from "@/utils/listingDetails";

interface ListingSummaryProps {
  listing: Listing;
  availability: string | null;
}

function ListingSummary({ listing, availability }: ListingSummaryProps) {
  const unitSummary = formatUnitSummary(listing);
  const name = formatListingName(listing);

  return (
    <div className="color-info-lighter">
      <div className="grid-container padding-y-4">
        <div className="margin-bottom-4">
          <ListingBreadcrumb current={name} />
        </div>

        <div className="grid-row grid-gap">
          <div className="grid-col-12 desktop:grid-col-8">
            {isIncomeBased(listing) && (
              <p className="margin-y-0">
                <span className="usa-tag bg-success-darker">{content.income_based}</span>
              </p>
            )}

            <h1 className="font-heading-2xl text-primary-darker margin-top-1 margin-bottom-1">
              {name}
            </h1>
            <p className="font-sans-lg margin-top-0" translate="no">
              {formatAddress(listing)}
            </p>

            <p className="font-sans-xl text-bold margin-bottom-0">
              {formatRent(listing) ?? results.rent_unavailable}
            </p>
            {unitSummary && <p className="font-sans-md margin-y-1">{unitSummary}</p>}
          </div>

          {availability && (
            <div className="grid-col-12 desktop:grid-col-4 desktop:padding-top-4">
              <p className="listing-detail__availability margin-bottom-0">
                <Icon icon="calendar_today" size="3" class="text-success-darker" />
                {availability}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingSummary;
