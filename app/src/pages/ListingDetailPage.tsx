import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import type { Listing } from "@/clients/listings";
import Alert from "@/components/Alert/Alert";
import ListingBreadcrumb from "@/components/ListingDetail/ListingBreadcrumb";
import ListingDetailSkeleton from "@/components/ListingDetail/ListingDetailSkeleton";
import ListingSections from "@/components/ListingDetail/ListingSections";
import ListingSidebar from "@/components/ListingDetail/ListingSidebar";
import ListingSummary from "@/components/ListingDetail/ListingSummary";
import content from "@/data/content/en/listing-detail.json";
import { useListing } from "@/hooks/useListing";
import { listingDetails } from "@/utils/listingDetails";
import { listingImageUrl } from "@/utils/listingPhotos";

function ListingDetail({ listing }: { listing: Listing }) {
  const details = useMemo(() => listingDetails(listing), [listing]);
  const photo = listingImageUrl(listing);

  return (
    <>
      <ListingSummary listing={listing} availability={details.availability} />
      <div className="grid-container padding-top-3 desktop:padding-top-4 padding-bottom-5">
        <div className="grid-row grid-gap">
          <div className="grid-col-12 desktop:grid-col-8">
            {photo && <img className="listing-detail__photo" src={photo} alt="" />}
            <ListingSections listing={listing} details={details} />
          </div>
          <div className="grid-col-12 desktop:grid-col-4 margin-top-4 desktop:margin-top-0">
            <ListingSidebar listing={listing} details={details} />
          </div>
        </div>
      </div>
    </>
  );
}

function ListingDetailPage() {
  const { uid = "" } = useParams();
  const state = useListing(uid);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (state.status === "ready") {
    return <ListingDetail listing={state.listing} />;
  }

  if (state.status === "loading") {
    return <ListingDetailSkeleton />;
  }

  return (
    <div className="grid-container padding-y-4">
      <ListingBreadcrumb />

      {state.status === "error" && (
        <div className="margin-top-4">
          <Alert type="error">{content.error}</Alert>
        </div>
      )}

      {state.status === "not_found" && (
        <>
          <h1 className="font-heading-xl margin-top-4">{content.not_found_heading}</h1>
          <p className="usa-intro">{content.not_found_message}</p>
          <Link to="/search" className="usa-button margin-top-2">
            {content.browse}
          </Link>
        </>
      )}
    </div>
  );
}

export default ListingDetailPage;
