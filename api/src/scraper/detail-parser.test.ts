import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detailUrl, parseListingDetail } from "./detail-parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(uid: number): string {
  return readFileSync(join(__dirname, `../../fixtures/legacy-listing-${uid}.html`), "utf-8");
}

const AVAILABLE = fixture(1388803);
const WAITLISTED = fixture(1389153);
const SENIOR = fixture(68240);
const NO_PHOTOS = fixture(401275);
const TOWNHOUSE = fixture(906200);
const NO_UTILITIES = fixture(1229408);

const SPARSE = `<html><body>
  <div class="tabularSection">
    <div class="tabularHeading">Specialized Information</div>
    <table class="tabularDetails">
      <tr><td class="tbL">Listing ID</td><td class="tbC">42</td></tr>
      <tr><td class="tbL"> </td><td class="tbC">unlabelled</td></tr>
      <tr><td colspan="3" class="expandedDivider"></td></tr>
    </table>
  </div>
  <div class="tabularSection"><table class="tabularDetails"></table></div>
  <div class="vuAppFee"></div>
</body></html>`;

describe("detail-parser", () => {
  it("builds the detail url from a uid", () => {
    expect(detailUrl(1388803)).toBe("https://www.myhousingsearch.com/dbh/ViewUnit/1388803");
  });

  it("reads the header fields the summary listing does not carry", () => {
    expect(parseListingDetail(AVAILABLE, 1388803)).toMatchObject({
      uid: 1388803,
      email: "housing@lsmnj.org",
      availability: "Available",
      leaseLength: "One Year",
      utilitiesIncluded: ["Electricity", "Gas", "Water", "Trash Pickup"],
      applicationFee: "No Application Fee",
      yearBuilt: 1998,
    });
  });

  it("reads a waitlisted listing with a single utility and photo", () => {
    expect(parseListingDetail(WAITLISTED, 1389153)).toMatchObject({
      email: "homes@cgph.net",
      availability: "Waiting List",
      utilitiesIncluded: ["Sewer"],
      yearBuilt: 2026,
      photoUrls: ["https://www.myhousingsearch.com/WebFile?id=3011121"],
    });
  });

  it("resolves photos to absolute urls in slideshow order", () => {
    expect(parseListingDetail(AVAILABLE, 1388803).photoUrls).toEqual([
      "https://www.myhousingsearch.com/WebFile?id=3010129",
      "https://www.myhousingsearch.com/WebFile?id=3010132",
    ]);
  });

  it("takes availability rather than a badge sharing its class", () => {
    expect(parseListingDetail(AVAILABLE, 1388803).availability).toBe("Available");
    expect(parseListingDetail(WAITLISTED, 1389153).availability).toBe("Waiting List");
    expect(parseListingDetail(SENIOR, 68240).availability).toBe("Waiting List");
  });

  it("extracts every tabular section plus the contact table", () => {
    const { sections } = parseListingDetail(AVAILABLE, 1388803);

    expect(Object.keys(sections)).toEqual([
      "Basic Features",
      "Appliances",
      "Utilities",
      "Specialized Information",
      "Accessibility",
      "Kitchen & Bath Accessibility",
      "Safety",
      "Parking and Entry",
      "Comments",
      "Contact",
    ]);

    expect(sections["Basic Features"]).toEqual({
      Pets: "Unknown",
      Smoking: "No Smoking",
      "Trash Service": "Yes",
      "School District": "Jersey City School District",
    });

    expect(sections["Parking and Entry"]).toMatchObject({
      "Parking Type": "On Street",
      "Unit Minimum Door Width": 'Doorway clear width -- 32" or wider',
    });
  });

  it("keeps whichever rows a listing happens to carry", () => {
    const { sections } = parseListingDetail(WAITLISTED, 1389153);

    expect(sections["Basic Features"]).toEqual({ Pets: "Allowed", Smoking: "No Smoking" });
    expect(sections["Parking and Entry"]).not.toHaveProperty("Other Entry Options");
    expect(sections.Contact).toMatchObject({
      Fax: "609-664-2786",
      Address: "1249 South River Road, Suite 301 Cranbury, NJ 08512-3633",
    });
    expect(sections.Contact).not.toHaveProperty("Phone (Other)");
  });

  it("joins values that the markup splits across a line break", () => {
    expect(parseListingDetail(AVAILABLE, 1388803).sections.Contact.Contact).toBe(
      "Natasha Macoon Lutheran Social Ministries of NJ, Private Owner",
    );
  });

  it("reads bulleted rows as arrays", () => {
    expect(parseListingDetail(AVAILABLE, 1388803).sections.Safety["Fire Safety"]).toEqual([
      "Smoke Detector",
      "Carbon Monoxide Detector",
      "Fire Supression / Sprinkler System",
    ]);
    expect(parseListingDetail(WAITLISTED, 1389153).sections.Safety["Fire Safety"]).toEqual([
      "Smoke Detector",
      "Carbon Monoxide Detector",
    ]);
  });

  it("reads rows out of a collapsed Comprehensive List exactly once", () => {
    const { sections } = parseListingDetail(AVAILABLE, 1388803);

    expect(sections["Kitchen & Bath Accessibility"]).toEqual({
      Kitchen: ["Front Controls on Stove/Cook-top"],
      "Non-digital Kitchen Appliances": "No",
      "Front Controls on Stove/Cook-top": "Yes",
      Bathroom: "Standard",
      "Toilet Grab Bars or Reinforcements": "No",
      "Bath Grab Bars or Reinforcements": "No",
      "Roll-in Shower": "No",
      "Walk-in Shower": "No",
      "Accessible Height Toilet": "No",
      "'T' Turn or 60\" Turning Circle in Bathrooms": "No",
    });
  });

  it("answers with nulls for a listing that carries almost nothing", () => {
    expect(parseListingDetail(SPARSE, 42)).toEqual({
      uid: 42,
      email: null,
      availability: null,
      leaseLength: null,
      utilitiesIncluded: [],
      applicationFee: null,
      yearBuilt: null,
      photoUrls: [],
      sections: { "Specialized Information": { "Listing ID": "42" }, Contact: {} },
    });
  });

  it("refuses a page that is not the listing we asked for", () => {
    expect(() => parseListingDetail(AVAILABLE, 999)).toThrow(
      'Expected detail page for uid 999, got "1388803"',
    );
  });

  it("refuses a page with no listing id at all", () => {
    expect(() => parseListingDetail("<html><body>503</body></html>", 1388803)).toThrow(
      "Expected detail page for uid 1388803, got undefined",
    );
  });

  it("picks up sections and rows only sometimes present", () => {
    const { sections, ...header } = parseListingDetail(SENIOR, 68240);

    expect(header).toMatchObject({
      email: "ecirilo-gray@springpointsl.org",
      utilitiesIncluded: ["Gas", "Water", "Heat"],
      yearBuilt: 1991,
      photoUrls: ["https://www.myhousingsearch.com/WebFile?id=3002998"],
    });

    expect(sections["Nearby Services"]).toEqual({
      "Shopping Venues": "Within Two Miles",
      "Grocery Shopping": "Within Two Miles",
      "Senior Center": "Five or More Miles",
      Pharmacy: "Within One Mile",
      "Also Nearby": ["Sidewalks", "Emergency Exits", "Dumpsters", "Community Shuttle"],
    });

    expect(sections["Basic Features"].Flooring).toBe("Vinyl");
    expect(sections["Specialized Information"]["Minimum Age"]).toBe("62 Years Old");
    expect(sections["Parking and Entry"]["Allotted Parking Spaces"]).toBe("1");
    expect(sections.Contact.Website).toBe("springpointsl.org/");
  });

  it("tolerates a label whose value is a string on one listing and a list on another", () => {
    expect(
      parseListingDetail(AVAILABLE, 1388803).sections["Kitchen & Bath Accessibility"].Bathroom,
    ).toBe("Standard");
    expect(
      parseListingDetail(SENIOR, 68240).sections["Kitchen & Bath Accessibility"].Bathroom,
    ).toEqual(["Grab Bars"]);
    expect(parseListingDetail(NO_PHOTOS, 401275).sections["Nearby Services"]["Also Nearby"]).toBe(
      "Recreational Facilities",
    );
    expect(
      parseListingDetail(NO_UTILITIES, 1229408).sections["Nearby Services"]["Also Nearby"],
    ).toEqual(["Sidewalks", "Emergency Exits", "Work-out Room", "Clubhouse"]);
  });

  it("reports no photos rather than the placeholder graphic", () => {
    expect(parseListingDetail(NO_PHOTOS, 401275).photoUrls).toEqual([]);
  });

  it("reads a listing whose tenant pays every utility", () => {
    expect(parseListingDetail(NO_UTILITIES, 1229408)).toMatchObject({
      availability: "Waiting List",
      utilitiesIncluded: [],
      applicationFee: "Application Fee: $35 Per Adult",
      yearBuilt: 2022,
    });
  });

  it("reads availability phrasings other than available or waitlisted", () => {
    expect(parseListingDetail(NO_PHOTOS, 401275)).toMatchObject({
      availability: "Under Construction",
      leaseLength: "Monthly",
      email: null,
    });
    expect(parseListingDetail(TOWNHOUSE, 906200)).toMatchObject({
      availability: "Available 08/03/26",
      applicationFee: "Application Fee: $45 Per Adult, Negotiable",
    });
  });
});
