-- Reference data every environment needs. Plans match production as of
-- 2026-11-09 (blaqora.store/api/pricing-plans).

insert into public.pricing_plans
  (plan_key, name, description, monthly_fee, transaction_fee_percentage, transaction_fee_fixed,
   product_limit, allowed_selling_types, features, is_popular, display_order)
values
  ('free', 'Free', 'Pay only when you make money', 0, 5, 50, null,
   array['digital', 'event', 'physical', 'appointment'],
   '["No upfront or monthly fees", "You only pay when your store makes money"]', false, 0),
  ('starter', 'Starter', 'For small businesses with a focused offering', 5000, 3.5, 50, 20,
   array['physical'],
   '["Up to 20 physical products", "Lower transaction fees than Free"]', true, 1),
  ('pro', 'Pro', 'For growing businesses that need more flexibility', 12000, 2.5, 50, null,
   array['digital', 'event', 'physical', 'appointment'],
   '["Unlimited products", "Every way to sell", "Lowest transaction fees"]', false, 2)
on conflict (plan_key) do nothing;

insert into public.platform_settings (commission_percentage, minimum_withdrawal_amount, auto_withdrawal_enabled)
values (10, 5000, false)
on conflict (singleton) do nothing;
