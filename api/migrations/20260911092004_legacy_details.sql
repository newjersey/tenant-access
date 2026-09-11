-- Migration: legacy_details
-- Created: 2026-09-11 09:20:04

ALTER TABLE listings ADD COLUMN IF NOT EXISTS legacy_details JSONB;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_keys TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE listings ADD COLUMN IF NOT EXISTS details_scraped_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS listings_legacy_details_idx ON listings USING GIN (legacy_details);

CREATE INDEX IF NOT EXISTS listings_details_scraped_at_idx ON listings (details_scraped_at);
