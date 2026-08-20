-- Migration: add_rent_max
-- Created: 2026-08-18 15:56:34

 -- Rent is frequently a range ("$25 - $1,913") or a set of AMI tiers, so the
-- single rent column could not represent it. rent now holds the low bound and
-- rent_max the high bound (NULL when a listing quotes one figure).
ALTER TABLE listings ADD COLUMN rent_max INTEGER;

-- Income-based listings legitimately quote $0 as the low bound.
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_rent_check;
ALTER TABLE listings ADD CONSTRAINT listings_rent_check CHECK (rent >= 0);
ALTER TABLE listings ADD CONSTRAINT listings_rent_max_check
  CHECK (rent_max IS NULL OR rent_max >= rent);


