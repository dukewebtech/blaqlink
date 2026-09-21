-- Weight/dimensions a live courier rate needs for a physical item. Nullable —
-- the same table serves ticket/booking/digital products and the bulk importer,
-- and it's only actually required (app-level, in the product form) when
-- product_type = 'physical' and the vendor's shipping_mode isn't 'manual'.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
