import { Accordion } from "@trussworks/react-uswds";
import type { ReactNode } from "react";
import type { Listing } from "@/clients/listings";
import { CheckList, FactList } from "@/components/ListingDetail/DetailLists";
import content from "@/data/content/en/listing-detail.json";
import type { ListingDetailsView } from "@/utils/listingDetails";

const SECTION_HEADING = "font-heading-xl text-primary-darker margin-top-5 margin-bottom-2";

function Detail({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="margin-bottom-3">
      <h3 className="font-sans-md margin-bottom-1">{heading}</h3>
      {children}
    </div>
  );
}

function Amount({
  heading,
  amount,
  note,
}: {
  heading: string;
  amount: string;
  note?: string | null;
}) {
  return (
    <div className="margin-bottom-3">
      <h3 className="font-sans-sm margin-bottom-0">{heading}</h3>
      <p className="font-sans-xl text-bold text-success-darker margin-y-05">{amount}</p>
      {note && <p className="margin-top-0">{note}</p>}
    </div>
  );
}

interface ListingSectionsProps {
  listing: Listing;
  details: ListingDetailsView;
}

function ListingSections({ listing, details }: ListingSectionsProps) {
  const hasEligibility = details.incomeQualifications || details.ageQualifications.length > 0;
  const hasAccessibility =
    details.accessibility.length > 0 || details.accessibilityDetails.length > 0;
  const hasApplication =
    details.applicationFee || listing.depositRange || details.managerNotes.length > 0;

  return (
    <>
      {hasEligibility && (
        <section>
          <h2 className={SECTION_HEADING}>{content.eligibility}</h2>
          {details.incomeQualifications && (
            <Detail heading={content.income_qualifications}>
              <p className="margin-top-0">{details.incomeQualifications}</p>
            </Detail>
          )}
          {details.ageQualifications.length > 0 && (
            <Detail heading={content.age_qualifications}>
              <FactList facts={details.ageQualifications} />
            </Detail>
          )}
        </section>
      )}

      <section>
        <h2 className={SECTION_HEADING}>{content.property_details}</h2>
        {details.petPolicy && (
          <Detail heading={content.pet_policy}>
            <p className="margin-top-0">{details.petPolicy}</p>
          </Detail>
        )}
        {details.smokingPolicy && (
          <Detail heading={content.smoking_policy}>
            <p className="margin-top-0">{details.smokingPolicy}</p>
          </Detail>
        )}
        {details.amenities.length > 0 && (
          <Detail heading={content.amenities}>
            <CheckList items={details.amenities} />
          </Detail>
        )}
        {details.features.length > 0 && (
          <Detail heading={content.features}>
            <CheckList items={details.features} />
          </Detail>
        )}
        {(details.fireSafety.length > 0 || details.leadSafety) && (
          <Detail heading={content.safety}>
            <CheckList items={details.fireSafety} />
            {details.leadSafety && (
              <>
                <p>{details.leadSafety}</p>
                <ul className="usa-list">
                  <li>
                    <a href={content.hud_lead_guidelines_url} target="_blank" rel="noreferrer">
                      {content.hud_lead_guidelines}
                    </a>
                  </li>
                  <li>
                    <a href={content.lead_disclosure_rule_url} target="_blank" rel="noreferrer">
                      {content.lead_disclosure_rule}
                    </a>
                  </li>
                </ul>
              </>
            )}
          </Detail>
        )}
        {(details.utilities.length > 0 || details.utilitiesIncluded.length > 0) && (
          <Detail heading={content.utilities}>
            <CheckList items={details.utilities} />
            {details.utilitiesIncluded.length > 0 && (
              <p>
                <strong>{content.utilities_included}</strong> {details.utilitiesIncluded.join(", ")}
              </p>
            )}
          </Detail>
        )}
        {hasAccessibility && (
          <Detail heading={content.accessibility}>
            <CheckList items={details.accessibility.map((fact) => String(fact.value))} />
            {details.accessibilityDetails.length > 0 && (
              <Accordion
                className="margin-top-2"
                bordered={false}
                multiselectable
                items={[
                  {
                    id: "accessibility-details",
                    title: content.accessibility_details,
                    content: <FactList facts={details.accessibilityDetails} />,
                    expanded: false,
                    headingLevel: "h4",
                  },
                ]}
              />
            )}
          </Detail>
        )}
        {details.leaseLength && (
          <Detail heading={content.lease_length}>
            <p className="margin-top-0">{details.leaseLength}</p>
          </Detail>
        )}
        {details.yearBuilt && (
          <Detail heading={content.year_built}>
            <p className="margin-top-0">{details.yearBuilt}</p>
          </Detail>
        )}
      </section>

      {hasApplication && (
        <section>
          <h2 className={SECTION_HEADING}>{content.application_information}</h2>
          {details.applicationFee && (
            <Amount
              heading={content.application_fee}
              amount={details.applicationFee.amount}
              note={details.applicationFee.note}
            />
          )}
          {listing.depositRange && (
            <Amount heading={content.deposit} amount={listing.depositRange} />
          )}
          {details.managerNotes.length > 0 && (
            <Accordion
              bordered={false}
              multiselectable
              items={[
                {
                  id: "manager-notes",
                  title: content.manager_notes,
                  content: <FactList facts={details.managerNotes} />,
                  expanded: false,
                  headingLevel: "h3",
                },
              ]}
            />
          )}
        </section>
      )}

      {details.additionalDetails.length > 0 && (
        <section>
          <h2 className={SECTION_HEADING}>{content.additional_details}</h2>
          <Accordion
            bordered={false}
            multiselectable
            items={details.additionalDetails.map((group, index) => ({
              id: `additional-details-${index}`,
              title: group.heading,
              content: <FactList facts={group.facts} />,
              expanded: false,
              headingLevel: "h3",
            }))}
          />
        </section>
      )}
    </>
  );
}

export default ListingSections;
