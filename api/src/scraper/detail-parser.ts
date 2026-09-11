import * as cheerio from "cheerio/slim";

const LEGACY_ORIGIN = "https://www.myhousingsearch.com";

export function detailUrl(uid: number): string {
  return `${LEGACY_ORIGIN}/dbh/ViewUnit/${uid}`;
}

export type DetailValue = string | string[];

export type DetailSections = Record<string, Record<string, DetailValue>>;

export interface ListingDetails {
  uid: number;
  email: string | null;
  availability: string | null;
  leaseLength: string | null;
  utilitiesIncluded: string[];
  applicationFee: string | null;
  yearBuilt: number | null;
  photoUrls: string[];
  sections: DetailSections;
}

type Selection = ReturnType<cheerio.CheerioAPI>;

function clean(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function firstText($: cheerio.CheerioAPI, selector: string): string | null {
  const found = $(selector);
  if (found.length === 0) return null;
  return clean(found.first().text()) || null;
}

// .vuAvail is used for more than one
function readAvailability($: cheerio.CheerioAPI): string | null {
  const availability = $(".vuAvail").not(':has(a[href*="income_restricted"])');
  return clean(availability.first().text()) || null;
}

function readRows($: cheerio.CheerioAPI, within: Selection): Record<string, DetailValue> {
  const rows: Record<string, DetailValue> = {};

  within.find("tr").each((_, tr) => {
    const row = $(tr);
    if (row.children("td.tbL").length === 0) return;

    const label = clean(row.children("td.tbL").text());
    if (!label) return;

    const value = row.children("td.tbC").clone();
    value.find("img").remove();
    value.find("br").replaceWith(" ");

    const bullets = value.find("ul.tabularULContent li");
    rows[label] =
      bullets.length > 0 ? bullets.map((__, li) => clean($(li).text())).get() : clean(value.text());
  });

  return rows;
}

function readSections($: cheerio.CheerioAPI): DetailSections {
  const sections: DetailSections = {};

  $(".tabularSection").each((_, section) => {
    const heading = clean($(section).find(".tabularHeading").first().text());
    if (heading) sections[heading] = readRows($, $(section));
  });

  return sections;
}

export function parseListingDetail(html: string, uid: number): ListingDetails {
  const $ = cheerio.load(html);
  const sections = readSections($);

  // to make sure it's not a 503 (which has happened before) or other error
  const pageUid = sections["Specialized Information"]?.["Listing ID"];
  if (pageUid !== String(uid)) {
    throw new Error(`Expected detail page for uid ${uid}, got ${JSON.stringify(pageUid)}`);
  }

  const contact = readRows($, $(".vuContact"));

  const lease = firstText($, ".vuLeaseLength");
  const utilities = firstText($, ".vuIncUtil");
  const built = clean($(".vuSqFtYr").text()).match(/Built\s+(\d{4})/);

  return {
    uid,
    email: typeof contact.Email === "string" ? contact.Email : null,
    availability: readAvailability($),
    leaseLength: lease?.replace(/\s*Lease$/i, "") ?? null,
    utilitiesIncluded: utilities
      ? utilities.replace(/^Utilities Included:\s*/i, "").split(/\s*,\s*/)
      : [],
    applicationFee: firstText($, ".vuAppFee"),
    yearBuilt: built ? Number(built[1]) : null,
    photoUrls: $(".vuPics img[src]")
      .map((_, img) => new URL(String($(img).attr("src")), LEGACY_ORIGIN).toString())
      .get(),
    sections: { ...sections, Contact: contact },
  };
}
