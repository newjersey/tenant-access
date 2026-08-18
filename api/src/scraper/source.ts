const SEARCH_PARAMS = {
  direction: "desc",
  ch: "NJ",
  region_id: "33878",
  low_rent: "0",
  showmax: "-1",
  advanced: "t",
  nosp: "f",
  filter: "t",
  sortby: "last_updated",
  type: "rental",
  map_mode: "f",
} as const;

const SEARCH_ENDPOINT = "https://www.myhousingsearch.com/dbh/SearchHousingSubmit.html";

export const SEARCH_URL = `${SEARCH_ENDPOINT}?${new URLSearchParams(SEARCH_PARAMS)}`;
