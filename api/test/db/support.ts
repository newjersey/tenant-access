import { Client } from "pg";
import type { Listing } from "../../src/scraper/parser.js";

export const TEST_DB = {
  host: "127.0.0.1",
  port: 55432,
  database: "tenantaccess",
  user: "tenantadmin",
  password: "localtestonly",
};

export const TEST_DB_ENV = {
  DB_HOST: TEST_DB.host,
  DB_PORT: String(TEST_DB.port),
  DB_NAME: TEST_DB.database,
  DB_USER: TEST_DB.user,
  DB_PASSWORD: TEST_DB.password,
  DB_SSL: "disable",
  BUCKET_NAME: "test-bucket",
  ORIGIN_SECRET: "test-origin-secret",
};

export async function testClient(): Promise<Client> {
  const client = new Client(TEST_DB);
  await client.connect();
  return client;
}

// these tables always stay the same (barring Mortal Engines-style mobile city scenario)
const REFERENCE_TABLES = new Set(["counties", "city_counties"]);

export async function truncateAll(client: Client): Promise<void> {
  const { rows } = await client.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  const tables = rows
    .map((row) => row.tablename)
    .filter((name) => !REFERENCE_TABLES.has(name))
    .map((name) => `"${name}"`);

  if (tables.length === 0) return;
  await client.query(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
}

export function makeListing(uid: number, overrides: Partial<Listing> = {}): Listing {
  return {
    uid,
    name: `Listing ${uid}`,
    address: `${uid} Main St`,
    city: "Trenton",
    state: "NJ",
    zipCode: "08608",
    rent: 1500,
    rentMax: null,
    bedrooms: 2,
    bathrooms: 1,
    unitType: "Apartment",
    imageId: null,
    imageUrl: null,
    phoneNumber: null,
    website: null,
    description: null,
    lastUpdated: "2026-08-01",
    isWaitlistOpen: false,
    amenities: [],
    contactName: null,
    contactOrganization: null,
    fullListingUrl: `https://example.test/${uid}`,
    rentType: "Market",
    depositRange: null,
    ...overrides,
  };
}

const INSERT_SQL = `
  INSERT INTO listings (
    uid, last_updated, name, address, city, state, zip_code, rent, rent_max,
    bedrooms, bathrooms, unit_type, image_id, image_url, phone_number, website,
    contact_name, contact_organization, description, is_waitlist_open, amenities,
    full_listing_url, rent_type, deposit_range, shown_to_public
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21, $22, $23, $24, $25
  )
`;

export async function seedListing(
  client: Client,
  listing: Listing,
  opts: { shownToPublic?: boolean } = {},
): Promise<void> {
  await client.query(INSERT_SQL, [
    listing.uid,
    listing.lastUpdated,
    listing.name,
    listing.address,
    listing.city,
    listing.state,
    listing.zipCode,
    listing.rent,
    listing.rentMax,
    listing.bedrooms,
    listing.bathrooms,
    listing.unitType,
    listing.imageId,
    listing.imageUrl,
    listing.phoneNumber,
    listing.website,
    listing.contactName,
    listing.contactOrganization,
    listing.description,
    listing.isWaitlistOpen,
    listing.amenities,
    listing.fullListingUrl,
    listing.rentType,
    listing.depositRange,
    opts.shownToPublic ?? true,
  ]);
}

export async function seedManyListings(
  client: Client,
  count: number,
  city = "Trenton",
): Promise<void> {
  await client.query(
    `INSERT INTO listings (uid, last_updated, name, address, city, state, bathrooms)
      SELECT i, '2026-08-01', 'Listing ' || i, i || ' Main St', $2, 'NJ', 1
      FROM generate_series(1, $1::int) AS i`,
    [count, city],
  );
}
