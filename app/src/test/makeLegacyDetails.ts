import type { LegacyDetails } from "@/clients/listings";

// trimmed from api/fixtures/legacy-listing-1229408.html as parsed by detail-parser.ts
export const makeLegacyDetails = (overrides: Partial<LegacyDetails> = {}): LegacyDetails => ({
  email: "leasing@example.com",
  availability: "Waiting List",
  leaseLength: "One Year",
  utilitiesIncluded: ["Water", "Sewer"],
  applicationFee: "Application Fee: $35 Per Adult",
  yearBuilt: 2022,
  sections: {
    "Basic Features": {
      Pets: "Unknown",
      Smoking: "No Smoking",
      "School District": "Monroe Township School District",
      Flooring: "Vinyl",
      "Other Features": "Patio, Balcony",
    },
    Appliances: {
      Microwave: "None",
      "Refrigerator / Freezer": "Freezer On Top",
      "Clothes Washer": "No Hookup",
      "Laundry Room / Facility": "On Site",
      "Other Appliances": "Dishwasher, Garbage Disposal",
    },
    Utilities: {
      "Air Conditioner": "Central",
      "Heating Type": "Electric",
      "Cable Ready": "Yes",
    },
    "Specialized Information": {
      "Listing ID": "1229408",
      "Tax Credit (LIHTC) Housing": "Yes",
      "Seniors Only": "No",
    },
    Accessibility: {
      "Counter/Vanity": 'Both Lowered With Min 27" High Knee Space',
      "Door/Faucet Handles": "Unknown",
    },
    "Kitchen & Bath Accessibility": {
      Kitchen: "Standard",
      "Roll-in Shower": "No",
    },
    Safety: {
      "New Jersey Lead-safety Level":
        "My unit was constructed after 1977 and is therefore presumed to be Lead Free.",
      "Learn More": "HUD Lead Paint Guidelines Lead Paint Disclosure Rule",
      "Fire Safety": ["Smoke Detector With Strobe", "Carbon Monoxide Detector With Strobe"],
    },
    "Parking and Entry": {
      "Parking Type": "Off Street",
      "Other Entry Options": ["Door Knock / Bell Signaler", "Accessible Elevators"],
    },
    "Nearby Services": {
      "Also Nearby": ["Sidewalks", "Clubhouse"],
    },
    Comments: {
      "Qualifiers For Income Based Rent or Income Restriction": "*Income restrictions apply.*",
      Amenities: "Close to shops and restaurants.",
      "Property Comments": "Now leasing brand new 1, 2, & 3 bedrooms!",
      "Owner/Manager Comments": "Please bring 2 forms of Government issued photo I.D.",
    },
    Contact: {
      Contact: "Valor Pointe Conifer Realty, Property Manager or Realtor",
      Phone: "609-378-1680",
      Website: "example.com/valor",
    },
  },
  ...overrides,
});
