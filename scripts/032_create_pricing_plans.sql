-- ============================================
-- Pricing Plans System
-- ============================================
-- Creates the pricing_plans table (admin-configurable Free/Starter/Pro
-- plans), assigns every vendor to a plan, and adds fee-snapshot columns
-- to orders so historical fees never change retroactively when an admin
-- edits a plan's pricing later.
-- ============================================

-- 1. pricing_plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT NOT NULL UNIQUE CHECK (plan_key IN ('free', 'starter', 'pro')),
  name TEXT NOT NULL,
  description TEXT,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0),
  transaction_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (transaction_fee_percentage >= 0 AND transaction_fee_percentage <= 100),
  transaction_fee_fixed NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (transaction_fee_fixed >= 0),
  product_limit INTEGER CHECK (product_limit IS NULL OR product_limit > 0), -- NULL = unlimited
  allowed_selling_types TEXT[] NOT NULL DEFAULT ARRAY['digital', 'event', 'physical', 'appointment'],
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON public.pricing_plans(is_active, display_order);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admins can read all pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admins can insert pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admins can update pricing plans" ON public.pricing_plans;

CREATE POLICY "Anyone can read active pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "Admins can insert pricing plans"
  ON public.pricing_plans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "Admins can update pricing plans"
  ON public.pricing_plans FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

DROP TRIGGER IF EXISTS update_pricing_plans_updated_at ON public.pricing_plans;
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Seed the three default plans (only if the table is empty)
INSERT INTO public.pricing_plans (
  plan_key, name, description, monthly_fee, transaction_fee_percentage, transaction_fee_fixed,
  product_limit, allowed_selling_types, features, is_popular, display_order
)
SELECT * FROM (VALUES
  (
    'free', 'Free', 'Pay only when you make money', 0::numeric, 5::numeric, 50::numeric,
    NULL::integer, ARRAY['digital', 'event', 'physical', 'appointment'],
    '["No upfront or monthly fees", "You only pay when your store makes money", "Great for new sellers who want to start without upfront costs"]'::jsonb,
    false, 0
  ),
  (
    'starter', 'Starter', 'For small businesses with a focused offering', 5000::numeric, 3.5::numeric, 50::numeric,
    20::integer, ARRAY['physical'],
    '["Up to 20 products", "Choose one selling type", "Lower transaction fees than Free"]'::jsonb,
    false, 1
  ),
  (
    'pro', 'Pro', 'For growing businesses that need more flexibility', 12000::numeric, 2.5::numeric, 50::numeric,
    NULL::integer, ARRAY['digital', 'event', 'physical', 'appointment'],
    '["100+ products", "Access to all selling types", "Lowest transaction fees"]'::jsonb,
    true, 2
  )
) AS seed(plan_key, name, description, monthly_fee, transaction_fee_percentage, transaction_fee_fixed, product_limit, allowed_selling_types, features, is_popular, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans);

-- 3. Assign every vendor to a plan (defaults to Free), backfilling existing users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.pricing_plans(id);

UPDATE public.users
SET plan_id = (SELECT id FROM public.pricing_plans WHERE plan_key = 'free')
WHERE plan_id IS NULL;

-- 4. Fee snapshot columns on orders — set once at payment time, never recomputed
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_fixed NUMERIC(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10, 2);

-- Verify
SELECT plan_key, name, monthly_fee, transaction_fee_percentage, transaction_fee_fixed, product_limit, allowed_selling_types
FROM public.pricing_plans
ORDER BY display_order;
