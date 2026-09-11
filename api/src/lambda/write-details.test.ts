import type { Client } from "pg";
import { describe, expect, it, vi } from "vitest";
import type { ListingDetails } from "../scraper/detail-parser.js";
import { writeListingDetails } from "./write-details.js";

const DETAILS: ListingDetails = {
  uid: 1229408,
  email: "leases@example.test",
  availability: "Waiting List",
  leaseLength: "One Year",
  utilitiesIncluded: [],
  applicationFee: "Application Fee: $35 Per Adult",
  yearBuilt: 2022,
  photoUrls: ["https://www.myhousingsearch.com/WebFile?id=2828661"],
  sections: { Safety: { "Fire Safety": ["Smoke Detector"] } },
};

function stubClient(rowCount: number) {
  const query = vi.fn().mockResolvedValue({ rowCount });
  return { client: { query } as unknown as Client, query };
}

describe("writeListingDetails", () => {
  it("binds the uid, the details as json, and the photo keys", async () => {
    const { client, query } = stubClient(1);

    await writeListingDetails(client, DETAILS, ["photos/1229408/2828661.jpg"]);

    expect(query).toHaveBeenCalledOnce();
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/^UPDATE listings/);
    expect(params).toHaveLength(3);
    expect(params[0]).toBe(1229408);
    expect(params[2]).toEqual(["photos/1229408/2828661.jpg"]);
  });

  it("throws when the listing row is gone", async () => {
    const { client } = stubClient(0);

    await expect(writeListingDetails(client, DETAILS, [])).rejects.toThrow(
      "No listings row for uid 1229408; details were not written",
    );
  });
});
