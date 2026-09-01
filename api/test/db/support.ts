import { Client } from "pg";
import type { Listing } from "../../src/scraper/parser.js";

export const TEST_DB = {
  host: "127.0.0.1",
  port: 55432,
  database: "tenantaccess",
  user: "tenantadmin",
  password: "localtestonly",
};

/** The same values, spelled as the env vars db.ts reads. */
export const TEST_DB_ENV = {
  DB_HOST: TEST_DB.host,
  DB_PORT: String(TEST_DB.port),
  DB_NAME: TEST_DB.database,
  DB_USER: TEST_DB.user,
  DB_PASSWORD: TEST_DB.password,
  DB_SSL: "disable",
  BUCKET_NAME: "test-bucket",
};

export async function testClient(): Promise<Client> {
  const client = new Client(TEST_DB);
  await client.connect();
  return client;
}

export async function truncateAll(client: Client): Promise<void> {
  const { rows } = await client.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  if (rows.length === 0) return;
  const tables = rows.map((row) => `"${row.tablename}"`).join(", ");
  await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
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
    lastUpdated: "2026-09-01",
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
