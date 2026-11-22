-- Table access rights. Newer Supabase projects don't grant these
-- automatically, and without them every request (even the server's) is
-- refused. Row level security still decides which rows each person sees.

grant usage on schema public to anon, authenticated, service_role;

-- The server (secret key): everything.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Signed-in vendors: only tables that have policies for them.
grant select, insert, update, delete on
  public.users, public.onboarding_progress, public.platform_settings, public.pricing_plans,
  public.categories, public.products, public.product_variants, public.ticket_tiers,
  public.delivery_areas, public.orders, public.order_items, public.tickets,
  public.withdrawal_requests
to authenticated;

-- Visitors who aren't signed in: the public price list only.
grant select on public.pricing_plans to anon;

-- Tables added later: server only, until a migration grants more.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
