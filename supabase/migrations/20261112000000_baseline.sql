-- Blaqora baseline schema.
--
-- Replaces the scripts/ chain, which no longer described the live database
-- (tables created by hand, scripts that never ran). Everything the app reads
-- or writes is defined here, with access rules stated once:
--
--   * The browser only talks to Supabase Auth. All table access goes through
--     the Next.js server, either as the signed-in vendor (RLS: own rows only)
--     or with the service-role key (bypasses RLS) for money, orders and
--     anything public.
--   * anon can read active pricing plans and nothing else.
--   * Columns that carry privilege or money (admin flags, plan, verification,
--     bank details, order totals) can only be changed by the server.
--   * Every function is revoked from anon/authenticated and granted to
--     service_role only.

create extension if not exists pgcrypto;

-- ── Shared helpers ─────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Pricing plans ──────────────────────────────────────────────────────────

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique check (plan_key in ('free', 'starter', 'pro')),
  name text not null,
  description text,
  monthly_fee numeric(10, 2) not null default 0 check (monthly_fee >= 0),
  transaction_fee_percentage numeric(5, 2) not null default 0
    check (transaction_fee_percentage >= 0 and transaction_fee_percentage <= 100),
  transaction_fee_fixed numeric(10, 2) not null default 0 check (transaction_fee_fixed >= 0),
  product_limit integer check (product_limit is null or product_limit > 0),
  allowed_selling_types text[] not null default array['digital', 'event', 'physical', 'appointment'],
  features jsonb not null default '[]'::jsonb,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger pricing_plans_updated_at before update on public.pricing_plans
  for each row execute function public.set_updated_at();

-- ── Users (vendor and admin profiles) ──────────────────────────────────────
-- id IS the auth user id. auth_id is kept as the same value because much of
-- the code filters on it; the check constraint makes divergence impossible
-- (the old schema let them differ, which silently broke updates).

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  auth_id uuid not null unique,
  email text not null unique,
  full_name text not null default 'User',
  role text not null default 'vendor' check (role in ('admin', 'vendor')),
  is_admin boolean not null default false,
  phone text,
  location text,
  profile_image text,
  business_name text,
  business_category text,
  business_address text,
  date_of_birth date,
  store_name text,
  store_slug text unique,
  store_city text,
  store_state text,
  store_bio text,
  store_logo_url text,
  store_cover_image_url text,
  store_brand_color text not null default '#155DFD',
  store_template text not null default 'daylight',
  store_font text not null default 'modern'
    check (store_font in ('modern', 'classic', 'minimal', 'elegant')),
  onboarding_completed boolean not null default false,
  -- identity & payouts (server-only, see protect_privileged_user_columns)
  legal_name text,
  payout_verified boolean not null default false,
  kyc_status text not null default 'not_submitted',
  admin_kyc_approved boolean not null default false,
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_approved_at timestamptz,
  kyc_rejection_reason text,
  bank_name text,
  account_number text,
  account_name text,
  plan_id uuid references public.pricing_plans (id),
  -- shipping
  shipping_mode text not null default 'manual' check (shipping_mode in ('manual', 'terminal_africa', 'shipbubble')),
  pickup_street text,
  pickup_line2 text,
  pickup_city text,
  pickup_state text,
  pickup_lga text,
  pickup_phone text,
  pickup_postal_code text,
  shipbubble_sender_address_code text,
  terminal_africa_api_key text,
  shipbubble_api_key text,
  default_parcel_weight_kg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_id_is_auth_id check (id = auth_id)
);
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Profile for every new login. Role is ALWAYS vendor: the old trigger copied
-- role from client-supplied sign-up metadata, so anyone could register as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, auth_id, email, full_name, role, plan_id)
  values (
    new.id,
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'User'),
    'vendor',
    (select id from public.pricing_plans where plan_key = 'free')
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vendors may edit their own profile, but never these columns (RLS can't
-- restrict columns). Only requests carrying a user's JWT are checked.
create or replace function public.protect_privileged_user_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Profiles are created by the server' using errcode = '42501';
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.role is distinct from old.role
     or new.plan_id is distinct from old.plan_id
     or new.payout_verified is distinct from old.payout_verified
     or new.legal_name is distinct from old.legal_name
     or new.kyc_status is distinct from old.kyc_status
     or new.admin_kyc_approved is distinct from old.admin_kyc_approved
     or new.kyc_approved_at is distinct from old.kyc_approved_at
     or new.bank_name is distinct from old.bank_name
     or new.account_number is distinct from old.account_number
     or new.account_name is distinct from old.account_name
     or new.store_slug is distinct from old.store_slug
     or new.email is distinct from old.email
     or new.id is distinct from old.id
     or new.auth_id is distinct from old.auth_id
  then
    raise exception 'Not allowed to change privileged user fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_privileged_user_columns
  before insert or update on public.users
  for each row execute function public.protect_privileged_user_columns();

-- ── Onboarding ─────────────────────────────────────────────────────────────

create table public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  current_step integer not null default 0,
  step_completed integer not null default 0,
  business_info_completed boolean not null default false,
  kyc_info_completed boolean not null default false,
  bank_info_completed boolean not null default false,
  store_setup_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  checklist_store_customized boolean not null default false,
  checklist_store_shared boolean not null default false,
  store_slug text,
  store_city text,
  store_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger onboarding_progress_updated_at before update on public.onboarding_progress
  for each row execute function public.set_updated_at();

-- ── Platform settings (single row) ─────────────────────────────────────────

create table public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  commission_percentage numeric(5, 2) not null default 10 check (commission_percentage between 0 and 100),
  minimum_withdrawal_amount numeric(10, 2) not null default 5000 check (minimum_withdrawal_amount >= 0),
  auto_withdrawal_enabled boolean not null default false,
  support_email text,
  tawkto_url text,
  whatsapp_community_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- ── Catalogue ──────────────────────────────────────────────────────────────

-- Categories are shared by every product type (product_type kept for old
-- rows, no longer used to filter).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  product_type text,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_user_id_idx on public.categories (user_id);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_type text not null check (product_type in ('digital', 'event', 'physical', 'appointment')),
  title text not null check (length(trim(title)) > 0),
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  -- category holds a categories.id as text (the convention every screen uses)
  category text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  images text[] not null default '{}',
  -- digital
  file_urls text[] not null default '{}',
  license_type text check (license_type in ('standard', 'extended')),
  download_limit integer check (download_limit is null or download_limit > 0),
  -- event
  event_date timestamptz,
  event_location text,
  -- physical (null stock = not tracked / unlimited; 0 = sold out)
  sku text,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  -- appointment
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  available_days text[] not null default '{}',
  start_time time,
  end_time time,
  time_slots text[] not null default '{}',
  booking_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_user_id_idx on public.products (user_id, status);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color_name text,
  color_hex text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  price numeric(10, 2) not null check (price >= 0),
  quantity_total integer check (quantity_total is null or quantity_total > 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ticket_tiers_product_id_idx on public.ticket_tiers (product_id, sort_order);
create trigger ticket_tiers_updated_at before update on public.ticket_tiers
  for each row execute function public.set_updated_at();

create table public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  note text,
  fee numeric(10, 2) not null check (fee >= 0),
  state text,
  city text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_areas_user_id_idx on public.delivery_areas (user_id);
create trigger delivery_areas_updated_at before update on public.delivery_areas
  for each row execute function public.set_updated_at();

-- ── Checkout & orders ──────────────────────────────────────────────────────

-- Server-priced checkout, saved before the buyer is sent to Paystack.
create table public.payment_sessions (
  reference text primary key,
  gateway text not null default 'paystack',
  order_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.shipping_rate_quotes (
  id text primary key,
  store_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('terminal_africa', 'shipbubble')),
  rates jsonb not null,
  request_token text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  customer_note text,
  shipping_address jsonb,
  delivery_method text check (delivery_method in ('delivery', 'pickup')),
  delivery_area text,
  delivery_address text,
  delivery_state text,
  delivery_city text,
  delivery_postal_code text,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  -- order lifecycle (vendor-facing)
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
  -- money (server-only)
  payment_reference text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'success', 'refunded')),
  platform_fee_percentage numeric(5, 2),
  platform_fee_fixed numeric(10, 2),
  platform_fee_amount numeric(12, 2),
  refunded_at timestamptz,
  refund_reference text,
  -- fulfilment
  fulfilment_status text not null default 'pending' check (fulfilment_status in ('pending', 'complete', 'failed')),
  needs_attention boolean not null default false,
  attention_reason text,
  emails_sent_at timestamptz,
  vendor_alerted_at timestamptz,
  shipping_provider text check (shipping_provider in ('terminal_africa', 'shipbubble')),
  shipping_rate_id text,
  shipping_request_token text,
  shipping_status text check (shipping_status in ('pending_booking', 'booking', 'booked', 'failed')),
  shipping_tracking_number text,
  shipping_tracking_url text,
  shipping_label_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index orders_payment_reference_key on public.orders (payment_reference) where payment_reference is not null;
create index orders_user_id_idx on public.orders (user_id, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_title text not null,
  product_type text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  product_variant_id uuid references public.product_variants (id) on delete set null,
  variant_label text,
  ticket_tier_id uuid references public.ticket_tiers (id) on delete set null,
  ticket_tier_name text,
  appointment_date date,
  appointment_time text,
  -- fulfilment is per item so a retry finishes only what's left
  fulfilled_at timestamptz,
  fulfilment_claimed_at timestamptz,
  fulfilment_error text,
  -- digital delivery: the link token, never a storage path
  download_token uuid not null default gen_random_uuid() unique,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_slot_idx on public.order_items (product_id, appointment_date, appointment_time);

-- One admission per row; the QR encodes the unguessable code.
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default encode(gen_random_bytes(16), 'hex'),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  seq integer not null,
  product_id uuid references public.products (id) on delete set null,
  vendor_id uuid not null references public.users (id) on delete cascade,
  ticket_tier_id uuid references public.ticket_tiers (id) on delete set null,
  holder_name text not null,
  status text not null default 'valid' check (status in ('valid', 'used', 'cancelled')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  unique (order_item_id, seq)
);
create index tickets_product_idx on public.tickets (product_id, status);

-- Stock, ticket and slot holds taken at checkout and released after 30 min
-- unless the payment confirms them.
create table public.inventory_holds (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  product_id uuid not null references public.products (id) on delete cascade,
  product_variant_id uuid references public.product_variants (id) on delete cascade,
  ticket_tier_id uuid references public.ticket_tiers (id) on delete cascade,
  appointment_date date,
  appointment_time text,
  quantity integer not null check (quantity > 0),
  status text not null default 'held' check (status in ('held', 'committed', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index inventory_holds_reference_idx on public.inventory_holds (reference);
create index inventory_holds_active_idx on public.inventory_holds (product_id, status, expires_at);
-- A slot can be held or booked by one checkout at a time.
create unique index inventory_holds_one_per_slot on public.inventory_holds (product_id, appointment_date, appointment_time)
  where appointment_date is not null and status in ('held', 'committed');

-- ── Payouts ────────────────────────────────────────────────────────────────

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  amount numeric(12, 2) not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed', 'rejected', 'failed')),
  admin_notes text,
  payout_gateway text,
  kora_payout_reference text,
  kora_payout_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index withdrawal_requests_user_id_idx on public.withdrawal_requests (user_id, created_at desc);
create trigger withdrawal_requests_updated_at before update on public.withdrawal_requests
  for each row execute function public.set_updated_at();

-- ── Rate limits ────────────────────────────────────────────────────────────

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- ── Server functions (service_role only) ───────────────────────────────────

-- Fixed-window counter. True = allowed.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean language plpgsql as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return v_hits <= p_max;
end;
$$;

-- What a vendor can withdraw. Paid orders count net of the platform fee;
-- refunded orders cost the vendor the fee (the Refund Policy keeps fees);
-- every withdrawal that isn't rejected/failed is committed.
create or replace function public.vendor_available_balance(p_user uuid)
returns numeric language sql stable as $$
  with settings as (
    select coalesce((select commission_percentage from public.platform_settings limit 1), 10) as rate
  ),
  earned as (
    select coalesce(sum(
      case
        when o.payment_status = 'success'
          then o.total_amount - coalesce(o.platform_fee_amount, o.total_amount * s.rate / 100)
        when o.payment_status = 'refunded'
          then -coalesce(o.platform_fee_amount, o.total_amount * s.rate / 100)
        else 0
      end), 0) as amount
    from public.orders o, settings s
    where o.user_id = p_user
  ),
  committed as (
    select coalesce(sum(amount), 0) as amount
    from public.withdrawal_requests
    where user_id = p_user and status not in ('rejected', 'failed')
  )
  select round((select amount from earned) - (select amount from committed), 2);
$$;

-- Balance check and insert under one per-vendor lock, so two requests at
-- once can't both pass.
create or replace function public.request_withdrawal(p_user uuid, p_amount numeric)
returns jsonb language plpgsql as $$
declare
  v_vendor public.users;
  v_min numeric;
  v_available numeric;
  v_row public.withdrawal_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended('withdraw:' || p_user::text, 0));

  select * into v_vendor from public.users where id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Account not found.');
  end if;
  if not v_vendor.payout_verified then
    return jsonb_build_object('ok', false, 'code', 'not_verified', 'message', 'Verify your identity before withdrawing.');
  end if;
  if v_vendor.bank_name is null or v_vendor.account_number is null or v_vendor.account_name is null then
    return jsonb_build_object('ok', false, 'code', 'no_bank', 'message', 'Add your bank account in Payout settings first.');
  end if;

  select coalesce((select minimum_withdrawal_amount from public.platform_settings limit 1), 5000) into v_min;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount', 'message', 'Enter a valid amount.');
  end if;
  if p_amount < v_min then
    return jsonb_build_object('ok', false, 'code', 'below_minimum', 'message', 'The minimum withdrawal is ₦' || to_char(v_min, 'FM999,999,999'), 'minimum', v_min);
  end if;

  v_available := public.vendor_available_balance(p_user);
  if p_amount > v_available then
    return jsonb_build_object('ok', false, 'code', 'insufficient', 'message', 'You can withdraw up to ₦' || to_char(greatest(v_available, 0), 'FM999,999,990.00'), 'available', v_available);
  end if;

  insert into public.withdrawal_requests (user_id, amount, bank_name, account_number, account_name)
  values (p_user, p_amount, v_vendor.bank_name, v_vendor.account_number, v_vendor.account_name)
  returning * into v_row;

  return jsonb_build_object('ok', true, 'withdrawal', to_jsonb(v_row));
end;
$$;

-- Reserve everything in a checkout under row locks. Expired holds are
-- released first. Returns {ok:true} or {ok:false, line, message}.
-- p_lines: [{product_id, quantity, product_variant_id?, ticket_tier_id?, appointment_date?, appointment_time?}]
create or replace function public.reserve_checkout(p_reference text, p_lines jsonb, p_ttl_minutes integer default 30)
returns jsonb language plpgsql as $$
declare
  v_line jsonb;
  v_idx integer := 0;
  v_qty integer;
  v_product public.products;
  v_variant public.product_variants;
  v_tier public.ticket_tiers;
  v_held integer;
  v_left integer;
  v_expires timestamptz := now() + make_interval(mins => p_ttl_minutes);
begin
  update public.inventory_holds set status = 'released'
  where status = 'held' and expires_at < now();

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'quantity')::integer;
    select * into v_product from public.products where id = (v_line ->> 'product_id')::uuid for update;

    if v_line ? 'product_variant_id' then
      select * into v_variant from public.product_variants where id = (v_line ->> 'product_variant_id')::uuid for update;
      select coalesce(sum(quantity), 0) into v_held from public.inventory_holds
        where product_variant_id = v_variant.id and status = 'held';
      v_left := v_variant.stock_quantity - v_held;
      if v_left < v_qty then
        return jsonb_build_object('ok', false, 'line', v_idx, 'left', greatest(v_left, 0),
          'message', case when v_left <= 0 then v_product.title || ' is sold out in that option.'
                          else 'Only ' || v_left || ' left of ' || v_product.title || ' in that option.' end);
      end if;
      insert into public.inventory_holds (reference, product_id, product_variant_id, quantity, expires_at)
      values (p_reference, v_product.id, v_variant.id, v_qty, v_expires);

    elsif v_line ? 'ticket_tier_id' then
      select * into v_tier from public.ticket_tiers where id = (v_line ->> 'ticket_tier_id')::uuid for update;
      if v_tier.quantity_total is not null then
        select coalesce(sum(quantity), 0) into v_held from public.inventory_holds
          where ticket_tier_id = v_tier.id and status = 'held';
        v_left := v_tier.quantity_total - v_tier.quantity_sold - v_held;
        if v_left < v_qty then
          return jsonb_build_object('ok', false, 'line', v_idx, 'left', greatest(v_left, 0),
            'message', case when v_left <= 0 then '"' || v_tier.name || '" tickets are sold out.'
                            else 'Only ' || v_left || ' "' || v_tier.name || '" tickets left.' end);
        end if;
      end if;
      insert into public.inventory_holds (reference, product_id, ticket_tier_id, quantity, expires_at)
      values (p_reference, v_product.id, v_tier.id, v_qty, v_expires);

    elsif v_line ? 'appointment_date' then
      if exists (
        select 1 from public.inventory_holds
        where product_id = v_product.id
          and appointment_date = (v_line ->> 'appointment_date')::date
          and appointment_time = v_line ->> 'appointment_time'
          and status in ('held', 'committed')
      ) then
        return jsonb_build_object('ok', false, 'line', v_idx, 'left', 0,
          'message', 'That time has just been taken. Pick another time.');
      end if;
      insert into public.inventory_holds (reference, product_id, appointment_date, appointment_time, quantity, expires_at)
      values (p_reference, v_product.id, (v_line ->> 'appointment_date')::date, v_line ->> 'appointment_time', 1, v_expires);

    elsif v_product.product_type = 'physical' and v_product.stock_quantity is not null then
      select coalesce(sum(quantity), 0) into v_held from public.inventory_holds
        where product_id = v_product.id and product_variant_id is null and status = 'held';
      v_left := v_product.stock_quantity - v_held;
      if v_left < v_qty then
        return jsonb_build_object('ok', false, 'line', v_idx, 'left', greatest(v_left, 0),
          'message', case when v_left <= 0 then v_product.title || ' is sold out.'
                          else 'Only ' || v_left || ' of ' || v_product.title || ' left.' end);
      end if;
      insert into public.inventory_holds (reference, product_id, quantity, expires_at)
      values (p_reference, v_product.id, v_qty, v_expires);
    end if;

    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'line', v_idx, 'left', 0,
      'message', 'That time has just been taken. Pick another time.');
end;
$$;

-- Turn a confirmed payment into an order, atomically and once per
-- reference. Converts the checkout's holds into real stock/ticket/slot
-- changes. If a hold had expired and the stock is gone, the order is still
-- created (the buyer paid) but flagged for the vendor.
-- Returns {order_id, created}.
create or replace function public.create_paid_order(p_order jsonb, p_items jsonb)
returns jsonb language plpgsql as $$
declare
  v_order_id uuid;
  v_reference text := p_order ->> 'payment_reference';
  v_item jsonb;
  v_hold public.inventory_holds;
  v_ok boolean;
  v_short text[] := '{}';
begin
  insert into public.orders (
    user_id, customer_email, customer_name, customer_phone, customer_note,
    delivery_method, delivery_area, delivery_address, delivery_state, delivery_city, delivery_postal_code,
    total_amount, status, payment_reference, payment_status,
    platform_fee_percentage, platform_fee_fixed, platform_fee_amount,
    shipping_provider, shipping_rate_id, shipping_request_token, shipping_status
  ) values (
    (p_order ->> 'user_id')::uuid, p_order ->> 'customer_email', p_order ->> 'customer_name',
    p_order ->> 'customer_phone', p_order ->> 'customer_note',
    p_order ->> 'delivery_method', p_order ->> 'delivery_area', p_order ->> 'delivery_address',
    p_order ->> 'delivery_state', p_order ->> 'delivery_city', p_order ->> 'delivery_postal_code',
    (p_order ->> 'total_amount')::numeric, 'confirmed', v_reference, 'success',
    (p_order ->> 'platform_fee_percentage')::numeric, (p_order ->> 'platform_fee_fixed')::numeric,
    (p_order ->> 'platform_fee_amount')::numeric,
    p_order ->> 'shipping_provider', p_order ->> 'shipping_rate_id', p_order ->> 'shipping_request_token',
    case when p_order ->> 'shipping_provider' is not null then 'pending_booking' end
  )
  on conflict (payment_reference) where payment_reference is not null do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select id into v_order_id from public.orders where payment_reference = v_reference;
    return jsonb_build_object('order_id', v_order_id, 'created', false);
  end if;

  insert into public.order_items (
    order_id, product_id, product_title, product_type, quantity, price, subtotal,
    product_variant_id, variant_label, ticket_tier_id, ticket_tier_name, appointment_date, appointment_time
  )
  select v_order_id, (i ->> 'product_id')::uuid, i ->> 'product_title', i ->> 'product_type',
         (i ->> 'quantity')::integer, (i ->> 'price')::numeric, (i ->> 'subtotal')::numeric,
         nullif(i ->> 'product_variant_id', '')::uuid, i ->> 'variant_label',
         nullif(i ->> 'ticket_tier_id', '')::uuid, i ->> 'ticket_tier_name',
         nullif(i ->> 'appointment_date', '')::date, nullif(i ->> 'appointment_time', '')
  from jsonb_array_elements(p_items) i;

  -- Apply each line's stock change, preferring its hold.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_ok := true;
    if nullif(v_item ->> 'product_variant_id', '') is not null then
      update public.product_variants set stock_quantity = stock_quantity - (v_item ->> 'quantity')::integer
      where id = (v_item ->> 'product_variant_id')::uuid and stock_quantity >= (v_item ->> 'quantity')::integer;
      v_ok := found;
    elsif nullif(v_item ->> 'ticket_tier_id', '') is not null then
      update public.ticket_tiers set quantity_sold = quantity_sold + (v_item ->> 'quantity')::integer
      where id = (v_item ->> 'ticket_tier_id')::uuid
        and (quantity_total is null or quantity_sold + (v_item ->> 'quantity')::integer <= quantity_total);
      v_ok := found;
    elsif nullif(v_item ->> 'appointment_date', '') is not null then
      -- the hold itself is the booking; a missing/expired hold that someone
      -- else has since taken is a clash
      select * into v_hold from public.inventory_holds
      where reference = v_reference and product_id = (v_item ->> 'product_id')::uuid
        and appointment_date = (v_item ->> 'appointment_date')::date and status = 'held';
      if not found then
        begin
          insert into public.inventory_holds (reference, product_id, appointment_date, appointment_time, quantity, status, expires_at)
          values (v_reference, (v_item ->> 'product_id')::uuid, (v_item ->> 'appointment_date')::date,
                  v_item ->> 'appointment_time', 1, 'committed', now());
        exception when unique_violation then
          v_ok := false;
        end;
      end if;
    elsif v_item ->> 'product_type' = 'physical' then
      update public.products set stock_quantity = stock_quantity - (v_item ->> 'quantity')::integer
      where id = (v_item ->> 'product_id')::uuid and stock_quantity is not null
        and stock_quantity >= (v_item ->> 'quantity')::integer;
      v_ok := found or exists (select 1 from public.products where id = (v_item ->> 'product_id')::uuid and stock_quantity is null);
    end if;

    if not v_ok then
      v_short := v_short || (v_item ->> 'product_title');
    end if;
  end loop;

  update public.inventory_holds set status = 'committed' where reference = v_reference and status = 'held';

  if array_length(v_short, 1) > 0 then
    update public.orders
    set needs_attention = true,
        attention_reason = 'Paid after stock ran out: ' || array_to_string(v_short, ', ') || '. Contact the buyer to refund or offer an alternative.'
    where id = v_order_id;
  end if;

  return jsonb_build_object('order_id', v_order_id, 'created', true);
end;
$$;

-- One-time ticket check-in for the ticket's own vendor.
create or replace function public.check_in_ticket(p_code text, p_vendor uuid, p_product uuid default null)
returns jsonb language plpgsql as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket from public.tickets where code = p_code for update;
  if not found or v_ticket.vendor_id <> p_vendor then
    return jsonb_build_object('result', 'not_found');
  end if;
  if p_product is not null and v_ticket.product_id is distinct from p_product then
    return jsonb_build_object('result', 'wrong_event', 'ticket', to_jsonb(v_ticket));
  end if;
  if v_ticket.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled', 'ticket', to_jsonb(v_ticket));
  end if;
  if v_ticket.status = 'used' then
    return jsonb_build_object('result', 'already_used', 'ticket', to_jsonb(v_ticket));
  end if;
  update public.tickets set status = 'used', checked_in_at = now(), checked_in_by = p_vendor
  where id = v_ticket.id returning * into v_ticket;
  return jsonb_build_object('result', 'checked_in', 'ticket', to_jsonb(v_ticket));
end;
$$;

-- Counts a download if the limit allows. Returns the item, or null.
create or replace function public.claim_download(p_token uuid)
returns jsonb language plpgsql as $$
declare
  v_item public.order_items;
  v_limit integer;
begin
  select oi.* into v_item
  from public.order_items oi join public.orders o on o.id = oi.order_id
  where oi.download_token = p_token and oi.product_type = 'digital' and o.payment_status = 'success'
  for update of oi;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  select download_limit into v_limit from public.products where id = v_item.product_id;
  if v_limit is not null and v_item.download_count >= v_limit then
    return jsonb_build_object('result', 'limit_reached', 'limit', v_limit);
  end if;
  update public.order_items set download_count = download_count + 1 where id = v_item.id;
  return jsonb_build_object('result', 'ok', 'product_id', v_item.product_id, 'order_id', v_item.order_id);
end;
$$;

-- Save a product with its ticket tiers and variants in one transaction.
-- p_product_id null = create. Input is already validated by
-- lib/products/schema.ts; this enforces ownership and protects sales history:
-- a tier with sales can't be removed or shrunk below what's sold.
create or replace function public.save_product(p_vendor uuid, p_product_id uuid, p_product jsonb, p_tiers jsonb, p_variants jsonb)
returns jsonb language plpgsql as $$
declare
  v_id uuid := p_product_id;
  v_type text := p_product ->> 'product_type';
  v_tier jsonb;
  v_var jsonb;
  v_keep_tiers uuid[] := '{}';
  v_keep_vars uuid[] := '{}';
  v_existing public.ticket_tiers;
  v_row public.products;
begin
  if v_id is not null then
    perform 1 from public.products where id = v_id and user_id = p_vendor for update;
    if not found then
      return jsonb_build_object('ok', false, 'status', 404, 'message', 'Product not found.');
    end if;
    if (select product_type from public.products where id = v_id) <> v_type then
      return jsonb_build_object('ok', false, 'status', 400, 'message', 'A product''s type can''t be changed. Create a new product instead.');
    end if;
  end if;

  if v_id is null then
    insert into public.products (user_id, product_type, title) values (p_vendor, v_type, p_product ->> 'title')
    returning id into v_id;
  end if;

  update public.products set
    status = p_product ->> 'status',
    title = p_product ->> 'title',
    description = p_product ->> 'description',
    price = coalesce((p_product ->> 'price')::numeric, 0),
    compare_at_price = (p_product ->> 'compare_at_price')::numeric,
    category = p_product ->> 'category',
    images = coalesce(array(select jsonb_array_elements_text(p_product -> 'images')), '{}'),
    file_urls = coalesce(array(select jsonb_array_elements_text(p_product -> 'file_urls')), '{}'),
    license_type = p_product ->> 'license_type',
    download_limit = (p_product ->> 'download_limit')::integer,
    event_date = (p_product ->> 'event_date')::timestamptz,
    event_location = p_product ->> 'event_location',
    sku = p_product ->> 'sku',
    stock_quantity = case when jsonb_array_length(coalesce(p_variants, '[]')) > 0 then null
                          else (p_product ->> 'stock_quantity')::integer end,
    weight_kg = (p_product ->> 'weight_kg')::numeric,
    length_cm = (p_product ->> 'length_cm')::numeric,
    width_cm = (p_product ->> 'width_cm')::numeric,
    height_cm = (p_product ->> 'height_cm')::numeric,
    duration_minutes = (p_product ->> 'duration_minutes')::integer,
    available_days = coalesce(array(select jsonb_array_elements_text(p_product -> 'available_days')), '{}'),
    start_time = (p_product ->> 'start_time')::time,
    end_time = (p_product ->> 'end_time')::time,
    time_slots = coalesce(array(select jsonb_array_elements_text(p_product -> 'time_slots')), '{}'),
    booking_link = p_product ->> 'booking_link'
  where id = v_id;

  if v_type = 'event' then
    for v_tier in select * from jsonb_array_elements(coalesce(p_tiers, '[]')) loop
      if nullif(v_tier ->> 'id', '') is not null then
        select * into v_existing from public.ticket_tiers where id = (v_tier ->> 'id')::uuid and product_id = v_id for update;
        if not found then
          raise exception using errcode = 'P0001', message = 'A ticket type was changed somewhere else. Reload and try again.';
        end if;
        if (v_tier ->> 'quantity_total') is not null and (v_tier ->> 'quantity_total')::integer < v_existing.quantity_sold then
          raise exception using errcode = 'P0001',
            message = '"' || v_existing.name || '" has already sold ' || v_existing.quantity_sold || '. Its quantity can''t go below that.';
        end if;
        update public.ticket_tiers set name = v_tier ->> 'name', price = (v_tier ->> 'price')::numeric,
          quantity_total = (v_tier ->> 'quantity_total')::integer
        where id = v_existing.id;
        v_keep_tiers := v_keep_tiers || v_existing.id;
      else
        insert into public.ticket_tiers (product_id, name, price, quantity_total)
        values (v_id, v_tier ->> 'name', (v_tier ->> 'price')::numeric, (v_tier ->> 'quantity_total')::integer)
        returning id into v_existing.id;
        v_keep_tiers := v_keep_tiers || v_existing.id;
      end if;
    end loop;
    if exists (select 1 from public.ticket_tiers where product_id = v_id and id <> all(v_keep_tiers) and quantity_sold > 0) then
      raise exception using errcode = 'P0001', message = 'A ticket type that has sold tickets can''t be removed.';
    end if;
    delete from public.ticket_tiers where product_id = v_id and id <> all(v_keep_tiers);
    update public.ticket_tiers t set sort_order = o.ord - 1
    from unnest(v_keep_tiers) with ordinality as o(id, ord) where t.id = o.id;
  end if;

  if v_type = 'physical' then
    for v_var in select * from jsonb_array_elements(coalesce(p_variants, '[]')) loop
      if nullif(v_var ->> 'id', '') is not null then
        update public.product_variants set size = v_var ->> 'size', color_name = v_var ->> 'color_name',
          color_hex = v_var ->> 'color_hex', stock_quantity = (v_var ->> 'stock_quantity')::integer
        where id = (v_var ->> 'id')::uuid and product_id = v_id;
        if not found then
          raise exception using errcode = 'P0001', message = 'An option was changed somewhere else. Reload and try again.';
        end if;
        v_keep_vars := v_keep_vars || (v_var ->> 'id')::uuid;
      else
        insert into public.product_variants (product_id, size, color_name, color_hex, stock_quantity)
        values (v_id, v_var ->> 'size', v_var ->> 'color_name', v_var ->> 'color_hex', (v_var ->> 'stock_quantity')::integer)
        returning id into v_existing.id;
        v_keep_vars := v_keep_vars || v_existing.id;
      end if;
    end loop;
    delete from public.product_variants where product_id = v_id and id <> all(v_keep_vars);
  end if;

  select * into v_row from public.products where id = v_id;
  return jsonb_build_object('ok', true, 'product', to_jsonb(v_row));
exception
  when sqlstate 'P0001' then
    return jsonb_build_object('ok', false, 'status', 409, 'message', sqlerrm);
end;
$$;

-- Record a completed refund: the order stops counting as a sale (the fee is
-- kept, see vendor_available_balance), tickets stop working, and tickets
-- and booking slots go back on sale. Once per order.
create or replace function public.mark_order_refunded(p_order uuid, p_refund_reference text)
returns jsonb language plpgsql as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Order not found.');
  end if;
  if v_order.payment_status <> 'success' then
    return jsonb_build_object('ok', false, 'message', 'This order has already been refunded.');
  end if;

  update public.orders set payment_status = 'refunded', status = 'cancelled', refunded_at = now(),
    refund_reference = p_refund_reference, needs_attention = false, attention_reason = null
  where id = p_order;

  update public.tickets set status = 'cancelled' where order_id = p_order and status = 'valid';

  update public.ticket_tiers t set quantity_sold = greatest(t.quantity_sold - oi.quantity, 0)
  from public.order_items oi
  where oi.order_id = p_order and oi.ticket_tier_id = t.id;

  update public.inventory_holds set status = 'released'
  where reference = v_order.payment_reference and appointment_date is not null;

  return jsonb_build_object('ok', true);
end;
$$;

-- Move a paid booking to another free slot offered by the product.
create or replace function public.reschedule_booking(p_item uuid, p_vendor uuid, p_date date, p_time text)
returns jsonb language plpgsql as $$
declare
  v_item public.order_items;
  v_order public.orders;
  v_product public.products;
begin
  select * into v_item from public.order_items where id = p_item for update;
  if not found or v_item.product_type <> 'appointment' then
    return jsonb_build_object('ok', false, 'message', 'Booking not found.');
  end if;
  select * into v_order from public.orders where id = v_item.order_id;
  if v_order.user_id <> p_vendor then
    return jsonb_build_object('ok', false, 'message', 'Booking not found.');
  end if;
  if v_order.payment_status <> 'success' then
    return jsonb_build_object('ok', false, 'message', 'This booking was refunded.');
  end if;
  select * into v_product from public.products where id = v_item.product_id;
  if v_product.id is null or not (p_time = any(v_product.time_slots)) then
    return jsonb_build_object('ok', false, 'message', 'That time isn''t one of your session times.');
  end if;

  -- free the old slot, take the new one (unique index refuses a taken slot)
  update public.inventory_holds set status = 'released'
  where reference = v_order.payment_reference and product_id = v_item.product_id
    and appointment_date = v_item.appointment_date and appointment_time = v_item.appointment_time;
  insert into public.inventory_holds (reference, product_id, appointment_date, appointment_time, quantity, status, expires_at)
  values (v_order.payment_reference, v_item.product_id, p_date, p_time, 1, 'committed', now());

  update public.order_items set appointment_date = p_date, appointment_time = p_time where id = p_item;
  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'That time is already booked. Pick another.');
end;
$$;

-- Lock every function down to the server.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end;
$$;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ── Row level security ─────────────────────────────────────────────────────
-- users.id = auth.uid() for every vendor, so ownership is user_id = auth.uid().

alter table public.users enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.platform_settings enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.payment_sessions enable row level security;
alter table public.shipping_rate_quotes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tickets enable row level security;
alter table public.inventory_holds enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.rate_limits enable row level security;

create policy "own profile: read" on public.users for select to authenticated using (id = auth.uid());
create policy "own profile: update" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own onboarding" on public.onboarding_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "settings: read" on public.platform_settings for select to authenticated using (true);

create policy "plans: read active" on public.pricing_plans for select to anon, authenticated using (is_active);

create policy "own categories" on public.categories for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own products" on public.products for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own variants" on public.product_variants for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));
create policy "own tiers" on public.ticket_tiers for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));
create policy "own delivery areas" on public.delivery_areas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders, items, tickets and withdrawals are read-only to vendors; every
-- change goes through a server route that checks ownership.
create policy "own orders: read" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "own order items: read" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own tickets: read" on public.tickets for select to authenticated using (vendor_id = auth.uid());
create policy "own withdrawals: read" on public.withdrawal_requests for select to authenticated using (user_id = auth.uid());

-- payment_sessions, shipping_rate_quotes, inventory_holds, rate_limits: no
-- policies, server only.

-- ── Storage ────────────────────────────────────────────────────────────────
-- product-images: public to read (they're on the storefront).
-- digital-files: private; delivered only through /api/download-digital.
-- Uploads go into the uploader's own folder: <auth uid>/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 4194304,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('digital-files', 'digital-files', false, 104857600, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "images: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "images: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "files: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'digital-files' and (storage.foldername(name))[1] = auth.uid()::text);
