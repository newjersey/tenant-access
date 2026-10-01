import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeAddresses, parseCensusResults, toCensusCsv } from "./census.js";

const RESULTS = [
  '"4","44 Cook Avenue, Madison, NJ, 07940","Match","Exact","44 COOK AVE, MADISON, NJ, 07940","-74.415400758455,40.760642653772","60447967","L"',
  '"1","451 Bergen Ave, Jersey City, NJ, 07305","Match","Non_Exact","451 BERGEN AVE, JERSEY CITY, NJ, 07304","-74.077753665948,40.716951758032","59604236","L"',
  '"3","999999 Nowhere Rd, Newark, NJ, 07104","No_Match"',
  '"5","He said ""hi"" St, Newark, NJ, 07104","Tie"',
].join("\n");

const ADDRESS = {
  uid: 1,
  address: "451 Bergen Ave",
  city: "Jersey City",
  state: "NJ",
  zipCode: "07305",
};

function stubFetch(body: string, ok = true) {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok,
    status: 502,
    statusText: "Bad Gateway",
    text: async () => body,
  }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toCensusCsv", () => {
  it("quotes every field, escaping quotes and flattening newlines", () => {
    expect(
      toCensusCsv([
        ADDRESS,
        { uid: 2, address: '1 "Main", Apt 2\r\nRear', city: "Newark", state: "NJ", zipCode: "" },
      ]),
    ).toBe(
      [
        '"1","451 Bergen Ave","Jersey City","NJ","07305"',
        '"2","1 ""Main"", Apt 2 Rear","Newark","NJ",""',
      ].join("\n"),
    );
  });
});

describe("parseCensusResults", () => {
  it("maps Exact, Non_Exact, No_Match and Tie by uid", () => {
    expect(parseCensusResults(`${RESULTS}\r\n\n`)).toEqual([
      { uid: 4, match: "exact", latitude: 40.760642653772, longitude: -74.415400758455 },
      { uid: 1, match: "non_exact", latitude: 40.716951758032, longitude: -74.077753665948 },
      { uid: 3, match: "no_match", latitude: null, longitude: null },
      { uid: 5, match: "no_match", latitude: null, longitude: null },
    ]);
  });

  it("reads unquoted fields too", () => {
    expect(parseCensusResults("7,1 Main St,No_Match")).toEqual([
      { uid: 7, match: "no_match", latitude: null, longitude: null },
    ]);
  });

  it.each([
    ['"x","1 Main St","No_Match"'],
    ['"7","1 Main St","Maybe"'],
    ['"7","1 Main St","Match","Exact","1 MAIN ST",""'],
  ])("rejects an unexpected row: %s", (row) => {
    expect(() => parseCensusResults(row)).toThrow("Unexpected Census result row");
  });
});

describe("geocodeAddresses", () => {
  it("posts the addresses as a file to the batch endpoint", async () => {
    const fetch = stubFetch(RESULTS.split("\n")[1]);

    expect(await geocodeAddresses([ADDRESS])).toEqual([
      { uid: 1, match: "non_exact", latitude: 40.716951758032, longitude: -74.077753665948 },
    ]);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://geocoding.geo.census.gov/geocoder/locations/addressbatch");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form.get("benchmark")).toBe("Public_AR_Current");
    expect(await (form.get("addressFile") as File).text()).toBe(toCensusCsv([ADDRESS]));
  });

  it("throws when the geocoder errors", async () => {
    stubFetch("", false);

    await expect(geocodeAddresses([ADDRESS])).rejects.toThrow(
      "Census geocoder failed: 502 Bad Gateway",
    );
  });

  it("throws when rows go missing", async () => {
    stubFetch(RESULTS.split("\n")[1]);

    await expect(geocodeAddresses([ADDRESS, { ...ADDRESS, uid: 2 }])).rejects.toThrow(
      "Census geocoder returned 1 of 2 rows",
    );
  });
});
