-- New vendors default to Template 1 ("Daylight") with the design system's blue accent.
-- Existing stores keep whatever template/colour they already have — this only changes
-- the default applied to new rows.
ALTER TABLE users
  ALTER COLUMN store_template SET DEFAULT 'daylight',
  ALTER COLUMN store_brand_color SET DEFAULT '#155DFD';
