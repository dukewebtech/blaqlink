-- Lets a delivery zone carry a Nigerian state/city so checkout can auto-fill
-- (and lock) the shipping-address state/city fields once a shopper picks it,
-- instead of asking for the same location twice. Both nullable: state is only
-- required going forward at the application layer (new/edited zones), and a
-- vendor's existing catch-all zones (e.g. "Other states") keep working with
-- fully manual state/city entry at checkout, same as before this migration.
ALTER TABLE delivery_areas
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;
