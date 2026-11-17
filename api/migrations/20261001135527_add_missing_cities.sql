-- Migration: add_missing_cities
-- Created: 2026-10-01 13:55:27

INSERT INTO city_counties (city, county, latitude, longitude) VALUES
  ('Green Brook',   'Somerset', 40.598731, -74.478793), -- 08812
  ('Pompton Lakes', 'Passaic',  41.002734, -74.286742), -- 07442
  ('Riverdale',     'Morris',   40.995886, -74.314532); -- 07457
