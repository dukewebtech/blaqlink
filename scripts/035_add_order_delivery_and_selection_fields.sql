-- Checkout fields the new templates collect, beyond the customer_name/email/phone
-- that already exist on orders. shipping_address (JSONB) is left untouched so the
-- legacy non-storeId checkout keeps working; these are plain columns for the new flow.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_method TEXT CHECK (delivery_method IN ('delivery', 'pickup')),
  ADD COLUMN IF NOT EXISTS delivery_area TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Record exactly which variant / ticket tier / appointment slot a line item was
-- bought with, so it survives even if the vendor later edits or deletes the option.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_label TEXT,
  ADD COLUMN IF NOT EXISTS ticket_tier_id UUID REFERENCES ticket_tiers(id),
  ADD COLUMN IF NOT EXISTS ticket_tier_name TEXT,
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS appointment_time TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON order_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ticket_tier_id ON order_items(ticket_tier_id);
