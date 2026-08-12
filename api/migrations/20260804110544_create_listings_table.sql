-- Migration: create_listings_table
-- Created: 2026-08-04 11:05:44

-- Migration: create_listings_table
-- Created: 2026-08-04 11:05:44

CREATE TABLE listings (
  uid INTEGER PRIMARY KEY,

  -- Timestamps
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scraped_at TIMESTAMP DEFAULT NOW(),

  -- Basic info
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NJ',
  zip_code TEXT,

  -- Property details
  rent INTEGER CHECK (rent > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms DECIMAL(3,1) NOT NULL CHECK (bathrooms > 0),
  unit_type TEXT,

  -- Images
  image_id INTEGER,
  image_url TEXT,

  -- Contact
  phone_number TEXT,
  website TEXT,
  contact_name TEXT,
  contact_organization TEXT,

  -- Additional info
  description TEXT,
  is_waitlist_open BOOLEAN DEFAULT false,
  amenities TEXT[],
  full_listing_url TEXT,
  rent_type TEXT,
  deposit_range TEXT
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
