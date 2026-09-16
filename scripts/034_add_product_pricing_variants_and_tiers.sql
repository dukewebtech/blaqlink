-- Data the new storefront templates need on top of the existing products table:
--   - a compare-at price, for showing a struck-through "was" price on any item type
--   - discrete time-of-day slots for appointment/booking products
--   - a normalized table for physical-product size/colour options, each with its own stock
--   - a normalized table for event ticket tiers, tracking sold count so "left" can be shown

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS time_slots TEXT[]; -- e.g. ['09:00','11:00','13:00'], paired with available_days

-- ---------------------------------------------------------------------------
-- Product variants: size and/or colour options for physical products.
-- A variant can be size-only, colour-only, or a specific size+colour combo —
-- each row carries its own stock so "Navy / M" and "Navy / L" can differ.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color_name TEXT,
  color_hex TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_variants_has_option CHECK (size IS NOT NULL OR color_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_variants_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage their own product variants"
  ON public.product_variants FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE user_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products WHERE user_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view variants of published products"
  ON public.product_variants FOR SELECT
  USING (product_id IN (SELECT id FROM public.products WHERE status = 'published'));

-- ---------------------------------------------------------------------------
-- Ticket tiers: named price tiers for event products (Regular / VIP / Table for 4).
-- quantity_sold is incremented at order time so "quantity left" is always
-- quantity_total - quantity_sold, without a read-modify-write race on a JSON blob.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity_total INTEGER, -- NULL = unlimited
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_product_id ON public.ticket_tiers(product_id);

CREATE OR REPLACE FUNCTION update_ticket_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_tiers_updated_at
BEFORE UPDATE ON public.ticket_tiers
FOR EACH ROW
EXECUTE FUNCTION update_ticket_tiers_updated_at();

ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage their own ticket tiers"
  ON public.ticket_tiers FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE user_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products WHERE user_id IN (
        SELECT id FROM public.users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view ticket tiers of published products"
  ON public.ticket_tiers FOR SELECT
  USING (product_id IN (SELECT id FROM public.products WHERE status = 'published'));
