-- Migration: add_shown_to_public
-- Created: 2026-08-18 10:19:21

ALTER TABLE listings ADD COLUMN shown_to_public BOOLEAN NOT NULL DEFAULT true;
