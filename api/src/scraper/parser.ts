import * as cheerio from "cheerio";

export interface Listing {
  uid: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  unitType: string | null;
  imageId: number | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  website: string | null;
  description: string | null;
  lastUpdated: string | null;
  isWaitlistOpen: boolean;
  amenities: string[];
  contactName: string | null;
  contactOrganization: string | null;
  fullListingUrl: string | null;
  rentType: string | null;
  depositRange: string | null;
}

interface RowInfo {
  uid: number;
  image_id: number | null;
}

function extractRowInfo(html: string): RowInfo[] {
  const rowInfoMatch = html.match(/var row_info = (\[[\s\S]*?\]);/);

  if (!rowInfoMatch) {
    return [];
  }

  const jsonStr = rowInfoMatch[1]
    .replace(/uid:/g, '"uid":')
    .replace(/image_id:/g, '"image_id":')
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\/\/.*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  return JSON.parse(jsonStr);
}

function parseListingElement(
  $: cheerio.CheerioAPI,
  uid: number,
  imageId: number | null,
  scrapeDate: Date,
): Listing | null {
  const element = $(`#unit_${uid}`);

  if (!element.length) {
    return null;
  }

  const addressLink = element.find(".shsAddress a").first();
  const addressLinkText = addressLink.html() || "";
  const addressParts = addressLinkText.split("<br>").map((part) => part.trim());
  const name = addressParts[0] || "";
  const address = addressParts[1] || "";

  const cityStateZip = element.find(".shsCityStateZIP").first().text().trim();
  const cityMatch = cityStateZip.match(/(.*?),\s*([A-Z]{2})\s*(\d{5})?/);
  const city = cityMatch?.[1]?.trim() || "";
  const state = cityMatch?.[2] || "NJ";
  const zipCode = cityMatch?.[3] || "";

  const lpDesc = element.find(".shsLPdesc").first().text().trim();
  const bedroomsMatch = lpDesc.match(/(\d+)\s*Bed/i);
  const bathroomsMatch = lpDesc.match(/(\d+(?:\.\d+)?)\s*Bath/i);
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1], 10) : null;
  const bathrooms = bathroomsMatch ? parseFloat(bathroomsMatch[1]) : null;

  const unitTypeMatch = lpDesc.match(/Bath[^\w]*(.+?)$/i);
  const unitType = unitTypeMatch?.[1]?.trim() || null;

  const rentTypeElement = element.find(".shsCostLabel").first();
  const rentType = rentTypeElement.text().trim().replace(/\s+/g, " ") || "Standard Rent";

  let rent: number | null = null;
  const costNum = element.find(".shsCostNum").first();

  const rentInTable = costNum.find("td.ctr").last().text().trim();
  const rentMatch = rentInTable.match(/\$?([\d,]+)/);
  if (rentMatch) {
    rent = parseInt(rentMatch[1].replace(/,/g, ""), 10);
  } else {
    const rentText = element.find(".shsCost, .shsRent").first().text().trim();
    const regularRentMatch = rentText.match(/\$?([\d,]+)/);
    if (regularRentMatch) {
      rent = parseInt(regularRentMatch[1].replace(/,/g, ""), 10);
    }
  }

  const depositElement = element.find(".shsSDDNum").first();
  const depositText = depositElement.text().trim();
  const depositMatch = depositText.match(/Deposit\s*(.+)/i);
  const depositRaw = depositMatch?.[1]?.trim() || null;
  const depositRange = depositRaw
    ? depositRaw
        .replace(/[\u00A0\u2000-\u200B\u202F\u205F]/g, " ")
        .replace(/[\u2010-\u2015\u8209]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
    : null;

  const contactExtra = element.find(".contactExtra").first().text().trim();
  let contactName: string | null = null;
  let contactOrganization: string | null = null;

  if (contactExtra) {
    const contactParts = contactExtra.split(",").map((p) => p.trim());
    contactName = contactParts[0] || null;
    contactOrganization = contactParts[1] || null;
  }

  const phoneLink = element.find(".contactPhone").first();
  const phoneRaw = phoneLink.text().trim();
  const phoneNumber = phoneRaw
    ? phoneRaw.replace(/[\u2010-\u2015\u8209]/g, "-").replace(/\s+/g, "")
    : null;

  const fullListingLink = element.find(".shsLPvuLink a, .shsAddress a").first();
  const fullListingPath = fullListingLink.attr("href");
  const fullListingUrl = fullListingPath
    ? `https://www.myhousingsearch.com${fullListingPath}`
    : null;

  const website = element.find(".shsWebsite a").first().attr("href") || null;
  const description = element.find(".shsDescription").first().text().trim() || null;

  const lastUpdatedText = element.find(".shsLastUpdated").first().text().trim();
  let lastUpdated: string | null = null;

  if (lastUpdatedText.toLowerCase().includes("just updated")) {
    // Same calendar day as scrape date (start of day)
    lastUpdated = new Date(
      Date.UTC(scrapeDate.getUTCFullYear(), scrapeDate.getUTCMonth(), scrapeDate.getUTCDate()),
    ).toISOString();
  } else if (lastUpdatedText.toLowerCase().includes("updated this week")) {
    // Most recent Sunday
    const dayOfWeek = scrapeDate.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSubtract = dayOfWeek; // If today is Sunday, subtract 0; if Monday, subtract 1, etc.
    lastUpdated = new Date(
      Date.UTC(
        scrapeDate.getUTCFullYear(),
        scrapeDate.getUTCMonth(),
        scrapeDate.getUTCDate() - daysToSubtract,
      ),
    ).toISOString();
  } else if (lastUpdatedText.toLowerCase().includes("updated this month")) {
    // 1st day of current month
    lastUpdated = new Date(
      Date.UTC(scrapeDate.getUTCFullYear(), scrapeDate.getUTCMonth(), 1),
    ).toISOString();
  }

  const availText = element.find(".shsAvail").first().text().trim().toLowerCase();
  const isWaitlistOpen = availText.includes("waiting list") || availText.includes("waitlist");

  const amenities: string[] = [];
  element.find(".shsLPicons img").each((_, img) => {
    const alt = $(img).attr("alt");
    const title = $(img).attr("title");
    const amenityText = alt || title;
    if (amenityText) {
      const cleaned = amenityText.replace(/[()]/g, "").trim();
      if (cleaned) amenities.push(cleaned);
    }
  });

  const imageUrl = imageId ? `https://www.myhousingsearch.com/WebFile?id=${imageId}` : null;

  return {
    uid,
    name,
    address,
    city,
    state,
    zipCode,
    rent,
    bedrooms,
    bathrooms,
    unitType,
    imageId,
    imageUrl,
    phoneNumber,
    website,
    description,
    lastUpdated,
    isWaitlistOpen,
    amenities,
    contactName,
    contactOrganization,
    fullListingUrl,
    rentType,
    depositRange,
  };
}

export function parseListings(html: string, scrapeDate: Date = new Date()): Listing[] {
  const $ = cheerio.load(html);
  const rowInfo = extractRowInfo(html);

  const listings: Listing[] = [];

  for (const row of rowInfo) {
    const listing = parseListingElement($, row.uid, row.image_id, scrapeDate);
    if (listing) {
      listings.push(listing);
    }
  }

  return listings;
}
