import type { Listing } from "@/clients/listings";
import Icon from "@/components/Icon/Icon";
import content from "@/data/content/en/listing-detail.json";
import { formatAddress } from "@/utils/formatListing";
import { type ListingDetailsView, phoneHref, websiteHref } from "@/utils/listingDetails";

interface ListingSidebarProps {
  listing: Listing;
  details: ListingDetailsView;
}

function ListingSidebar({ listing, details }: ListingSidebarProps) {
  return (
    <>
      <section className="listing-detail__card">
        <h2 className="font-heading-lg margin-top-0">{content.contact_property}</h2>
        <ul className="usa-list usa-list--unstyled margin-bottom-3">
          {listing.contactName && (
            <li>
              <strong>{content.contact_name}</strong> {listing.contactName}
            </li>
          )}
          {listing.contactOrganization && (
            <li>
              <strong>{content.contact_organization}</strong> {listing.contactOrganization}
            </li>
          )}
          {listing.phoneNumber && (
            <li>
              <strong>{content.phone}</strong>{" "}
              <a href={phoneHref(listing.phoneNumber)}>{listing.phoneNumber}</a>
            </li>
          )}
          {details.email && (
            <li>
              <strong>{content.email}</strong>{" "}
              <a href={`mailto:${details.email}`}>{details.email}</a>
            </li>
          )}
        </ul>

        {details.website && (
          <a
            className="usa-button width-full"
            href={websiteHref(details.website)}
            target="_blank"
            rel="noreferrer"
          >
            {content.website}
          </a>
        )}
      </section>

      <section className="listing-detail__card">
        <h2 className="font-heading-lg margin-top-0 listing-detail__icon-heading">
          <Icon icon="location_on" size="4" class="text-primary-dark" />
          {content.location}
        </h2>
        {details.schoolDistrict && (
          <>
            <h3 className="font-sans-md margin-bottom-0">{content.school_district}</h3>
            <p className="margin-top-05">{details.schoolDistrict}</p>
          </>
        )}
        <p translate="no">{formatAddress(listing)}</p>
      </section>
    </>
  );
}

export default ListingSidebar;
