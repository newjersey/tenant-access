import ListingBreadcrumb from "@/components/ListingDetail/ListingBreadcrumb";
import content from "@/data/content/en/listing-detail.json";

function SkeletonDetail({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="margin-bottom-3">
      <p className="font-sans-md margin-bottom-1">
        <span className="skeleton-text">{heading}</span>
      </p>
      <p className="margin-top-0">
        <span className="skeleton-text">{text}</span>
      </p>
    </div>
  );
}

function ListingDetailSkeleton() {
  return (
    <>
      <p role="status" className="usa-sr-only">
        {content.loading}
      </p>

      <div className="color-info-lighter">
        <div className="grid-container padding-y-4">
          <div className="margin-bottom-4">
            <ListingBreadcrumb />
          </div>

          <div className="grid-row grid-gap" aria-hidden="true">
            <div className="grid-col-12 desktop:grid-col-8">
              <p className="font-heading-2xl margin-top-1 margin-bottom-1">
                <span className="skeleton-text">Sample Property Name</span>
              </p>
              <p className="font-sans-lg margin-top-0">
                <span className="skeleton-text">000 Sample Street, Township, NJ 00000</span>
              </p>
              <p className="font-sans-xl margin-bottom-0">
                <span className="skeleton-text">$0,000/month</span>
              </p>
              <p className="font-sans-md margin-y-1">
                <span className="skeleton-text">0 bed | 0 bath</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid-container padding-top-3 desktop:padding-top-4 padding-bottom-5"
        aria-hidden="true"
      >
        <div className="grid-row grid-gap">
          <div className="grid-col-12 desktop:grid-col-8">
            <div className="listing-detail__photo listing-detail__photo--empty skeleton-box" />
            <p className="font-heading-xl margin-top-5 margin-bottom-2">
              <span className="skeleton-text">Property Details</span>
            </p>
            <SkeletonDetail heading="Pet policy" text="Sample policy text for this property" />
            <SkeletonDetail
              heading="Amenities"
              text="Sample amenity, another sample amenity, and one more"
            />
            <SkeletonDetail heading="Lease length" text="00 months" />
          </div>
          <div className="grid-col-12 desktop:grid-col-4 margin-top-4 desktop:margin-top-0">
            <div className="listing-detail__card">
              <p className="font-heading-lg margin-top-0">
                <span className="skeleton-text">Contact Property</span>
              </p>
              <p>
                <span className="skeleton-text">Leasing agent name: Sample Name</span>
              </p>
              <p className="margin-bottom-3">
                <span className="skeleton-text">Phone number: (000) 000-0000</span>
              </p>
              <div className="skeleton-text height-5 margin-bottom-2" />
              <div className="skeleton-text height-5" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ListingDetailSkeleton;
