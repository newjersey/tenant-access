import { describe, expect, it } from "vitest";
import { makeLegacyDetails } from "@/test/makeLegacyDetails";
import { makeListing } from "@/test/makeListing";
import {
  checklist,
  isIncomeBased,
  listingDetails,
  parseApplicationFee,
  phoneHref,
  websiteHref,
} from "./listingDetails";

const details = listingDetails(makeListing({ legacyDetails: makeLegacyDetails() }));

describe("isIncomeBased", () => {
  it.each([
    ["Income Based Rent", true],
    ["Median Income Based Rent", true],
    ["Not Income Based", false],
    ["Standard Rent", false],
    [null, false],
  ])("treats %s as %s", (rentType, expected) => {
    expect(isIncomeBased({ rentType })).toBe(expected);
  });
});

describe("checklist", () => {
  it("names yes-rows by label, splits lists, and qualifies the rest", () => {
    expect(
      checklist({
        "Cable Ready": "Yes",
        "Other Appliances": "Dishwasher, Miniblinds",
        "Fire Safety": ["Smoke Detector", "Carbon Monoxide Detector"],
        "Heating Type": "Gas",
      }),
    ).toEqual([
      "Cable Ready",
      "Dishwasher",
      "Miniblinds",
      "Smoke Detector",
      "Carbon Monoxide Detector",
      "Heating Type (Gas)",
    ]);
  });

  it("leaves out features that are missing or unknown", () => {
    expect(
      checklist({ Microwave: "None", Washer: "No Hookup", Pets: "Unknown", Kitchen: "Standard" }),
    ).toEqual([]);
  });
});

describe("listingDetails", () => {
  it("maps the legacy sections onto the page's groupings", () => {
    expect(details).toMatchObject({
      availability: "Waiting List",
      incomeQualifications: "*Income restrictions apply.*",
      smokingPolicy: "No Smoking",
      features: [
        "Refrigerator / Freezer (Freezer On Top)",
        "Laundry Room / Facility (On Site)",
        "Dishwasher",
        "Garbage Disposal",
        "Patio",
        "Balcony",
      ],
      fireSafety: ["Smoke Detector With Strobe", "Carbon Monoxide Detector With Strobe"],
      leadSafety: "My unit was constructed after 1977 and is therefore presumed to be Lead Free.",
      utilities: ["Air Conditioner (Central)", "Heating Type (Electric)", "Cable Ready"],
      utilitiesIncluded: ["Water", "Sewer"],
      leaseLength: "One Year",
      yearBuilt: 2022,
      applicationFee: { amount: "$35", note: "Per Adult" },
      email: "leasing@example.com",
      website: "example.com/valor",
      schoolDistrict: "Monroe Township School District",
    });
  });

  it("drops unknown and negative policy values instead of showing them", () => {
    expect(details.petPolicy).toBeNull();
    expect(details.ageQualifications).toEqual([]);
    expect(details.accessibility).toEqual([
      { label: "Counter/Vanity", value: 'Both Lowered With Min 27" High Knee Space' },
    ]);
  });

  it("keeps the full accessibility rows, including the negatives, for the comprehensive list", () => {
    expect(details.accessibilityDetails).toEqual([
      { label: "Kitchen", value: "Standard" },
      { label: "Roll-in Shower", value: "No" },
      { label: "Parking Type", value: "Off Street" },
      {
        label: "Other Entry Options",
        value: ["Door Knock / Bell Signaler", "Accessible Elevators"],
      },
    ]);
  });

  it("collects the manager's notes in a fixed order", () => {
    expect(details.managerNotes).toEqual([
      {
        label: "Owner/Manager Comments",
        value: "Please bring 2 forms of Government issued photo I.D.",
      },
      { label: "Property Comments", value: "Now leasing brand new 1, 2, & 3 bedrooms!" },
    ]);
  });

  it("puts every row not shown elsewhere into additional details", () => {
    expect(details.additionalDetails).toEqual([
      { heading: "Basic Features", facts: [{ label: "Flooring", value: "Vinyl" }] },
      {
        heading: "Specialized Information",
        facts: [{ label: "Tax Credit (LIHTC) Housing", value: "Yes" }],
      },
      {
        heading: "Nearby Services",
        facts: [{ label: "Also Nearby", value: ["Sidewalks", "Clubhouse"] }],
      },
      {
        heading: "Comments",
        facts: [{ label: "Amenities", value: "Close to shops and restaurants." }],
      },
    ]);
  });

  it("shows senior and minimum-age rules as age qualifications", () => {
    const senior = listingDetails(
      makeListing({
        legacyDetails: makeLegacyDetails({
          sections: {
            "Specialized Information": {
              "Seniors Only": "Seniors and Qualified Disabled",
              "Minimum Age": "62 Years Old",
            },
          },
        }),
      }),
    );

    expect(senior.ageQualifications).toEqual([
      { label: "Seniors Only", value: "Seniors and Qualified Disabled" },
      { label: "Minimum Age", value: "62 Years Old" },
    ]);
  });

  it("falls back to the address-based school district", () => {
    const view = listingDetails(
      makeListing({
        legacyDetails: makeLegacyDetails({
          sections: {
            "Basic Features": {
              "Address-Based School District": "Neptune Township School District",
            },
          },
        }),
      }),
    );

    expect(view.schoolDistrict).toBe("Neptune Township School District");
  });

  it("returns an empty view for a listing whose detail page hasn't been scraped yet", () => {
    expect(listingDetails(makeListing({ legacyDetails: null }))).toEqual({
      availability: null,
      amenities: [],
      languages: [],
      incomeQualifications: null,
      ageQualifications: [],
      petPolicy: null,
      smokingPolicy: null,
      features: [],
      fireSafety: [],
      leadSafety: null,
      utilities: [],
      utilitiesIncluded: [],
      accessibility: [],
      accessibilityDetails: [],
      leaseLength: null,
      yearBuilt: null,
      applicationFee: null,
      managerNotes: [],
      email: null,
      website: null,
      schoolDistrict: null,
      additionalDetails: [],
    });
  });

  it("pulls the languages the landlord takes calls in out of the amenities", () => {
    const view = listingDetails(
      makeListing({
        amenities: [
          "Landlord can accept Spanish-language phone calls",
          "Washer/Dryer",
          "Landlord can accept Vietnamese-language phone calls",
        ],
      }),
    );

    expect(view.languages).toEqual(["Spanish", "Vietnamese"]);
    expect(view.amenities).toEqual(["Washer/Dryer"]);
  });

  it("doesn't change the listing it reads from", () => {
    const legacyDetails = makeLegacyDetails();
    listingDetails(makeListing({ legacyDetails }));

    expect(legacyDetails).toEqual(makeLegacyDetails());
  });
});

describe("parseApplicationFee", () => {
  it.each([
    ["Application Fee: $35 Per Adult", { amount: "$35", note: "Per Adult" }],
    [
      "Application Fee: $45 Per Adult, Negotiable",
      { amount: "$45", note: "Per Adult, Negotiable" },
    ],
    ["Application Fee: $1,000", { amount: "$1,000", note: null }],
    ["No Application Fee", { amount: "No Application Fee", note: null }],
    [null, null],
  ])("reads %s", (fee, expected) => {
    expect(parseApplicationFee(fee)).toEqual(expected);
  });
});

describe("phoneHref", () => {
  it.each([
    ["609-378-1680", "tel:6093781680"],
    ["609-664-2769 (5)", "tel:6096642769"],
    ["(609) 555-1234", "tel:6095551234"],
  ])("dials %s", (phone, expected) => {
    expect(phoneHref(phone)).toBe(expected);
  });
});

describe("websiteHref", () => {
  it("adds a scheme only when the site leaves it off", () => {
    expect(websiteHref("springpointsl.org/")).toBe("https://springpointsl.org/");
    expect(websiteHref("http://example.com")).toBe("http://example.com");
  });
});
