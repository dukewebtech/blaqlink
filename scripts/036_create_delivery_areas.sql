-- Per-vendor delivery areas and fees, plus the free pickup option.
-- Mirrors the storefront templates' rule exactly: a vendor offers "Deliver to me"
-- (priced per area) or "Pick up from the store" (always free). New vendors are
-- seeded with the same three areas/fees the templates ship with, and can edit
-- or replace them from their dashboard later.

CREATE TABLE IF NOT EXISTS public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note TEXT, -- e.g. "2 to 3 working days"
  fee DECIMAL(10, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_areas_user_id ON public.delivery_areas(user_id);

CREATE OR REPLACE FUNCTION update_delivery_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_areas_updated_at
BEFORE UPDATE ON public.delivery_areas
FOR EACH ROW
EXECUTE FUNCTION update_delivery_areas_updated_at();

ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage their own delivery areas"
  ON public.delivery_areas FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Public can view active delivery areas"
  ON public.delivery_areas FOR SELECT
  USING (is_active = true);

-- Seed the template's default three areas for every new vendor
CREATE OR REPLACE FUNCTION seed_default_delivery_areas_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.delivery_areas (user_id, name, note, fee, sort_order) VALUES
    (NEW.id, 'Lagos mainland', '2 to 3 working days', 3000, 0),
    (NEW.id, 'Lagos island', '1 to 2 working days', 4000, 1),
    (NEW.id, 'Other states', '3 to 7 working days', 6500, 2)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_seed_delivery_areas ON public.users;
CREATE TRIGGER on_user_created_seed_delivery_areas
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_delivery_areas_for_user();
