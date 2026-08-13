-- Migration: loosen_beds_baths_not_null
-- Created: 2026-08-11 12:15:18

ALTER TABLE listings ALTER COLUMN bedrooms DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN bathrooms DROP NOT NULL;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bathrooms_check;
