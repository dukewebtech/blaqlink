-- Database acceptance tests. Run against a fresh database with
-- supabase-stubs.sql, the migrations and seed.sql applied:
--   supabase/tests/run-db-tests.sh
-- Each test prints "PASS <name>" or stops with "FAIL <name>: <detail>".

\set ON_ERROR_STOP 1
\o /dev/null
set client_min_messages = warning;

create schema if not exists t;
create or replace function t.ok(cond boolean, name text, detail text default '') returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL %: %', name, detail; end if;
  raise notice 'PASS %', name;
end $$;

-- Act as a signed-in vendor / anonymous visitor / the server.
create or replace function t.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  execute 'set role authenticated';
end $$;
create or replace function t.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claim.role', 'anon', false);
  execute 'set role anon';
end $$;
create or replace function t.as_server() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claim.role', '', false);
end $$;
grant usage on schema t to anon, authenticated;
grant execute on all functions in schema t to anon, authenticated;

set client_min_messages = notice;

-- ── Sign-up ──────────────────────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'vendor-a@test.ng', '{"full_name":"Ada Vendor","role":"admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'vendor-b@test.ng', '{"full_name":"Bola Vendor"}');

select t.ok(
  (select role = 'vendor' and not is_admin and id = auth_id and plan_id = (select id from pricing_plans where plan_key = 'free')
   from users where email = 'vendor-a@test.ng'),
  'signup: role from metadata is ignored, profile id = login id, free plan');

-- ── Profile guard (C: self-escalation) ───────────────────────────────────
select t.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  begin
    update users set is_admin = true where id = auth.uid();
    raise exception 'FAIL guard: is_admin change was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update users set plan_id = (select id from pricing_plans where plan_key = 'pro') where id = auth.uid();
    raise exception 'FAIL guard: plan change was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update users set payout_verified = true, legal_name = 'X' where id = auth.uid();
    raise exception 'FAIL guard: self-verification was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update users set account_number = '0123456789' where id = auth.uid();
    raise exception 'FAIL guard: bank change was allowed';
  exception when insufficient_privilege then null; end;
end $$;
select t.ok(true, 'guard: vendor cannot change admin, plan, verification or bank fields');
update users set business_name = 'Ada Store' where id = auth.uid();
select t.ok((select business_name from users where id = auth.uid()) = 'Ada Store', 'guard: vendor can edit ordinary profile fields');
update users set business_name = 'hijacked' where id = '00000000-0000-0000-0000-00000000000b';
select t.ok((select count(*) from users) = 1, 'rls: vendor sees only their own profile');
select t.as_server();
select t.ok((select business_name from users where id = '00000000-0000-0000-0000-00000000000b') is null, 'rls: vendor cannot edit another profile');

-- ── Anonymous access ─────────────────────────────────────────────────────
select t.as_server();
update users set payout_verified = true, legal_name = 'ADA VENDOR', bank_name = 'GTBank', account_number = '0123456789', account_name = 'ADA VENDOR'
  where id = '00000000-0000-0000-0000-00000000000a';
insert into products (id, user_id, product_type, title, price, status, file_urls)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'digital', 'Planner', 2000, 'published', '{digital-files:a/planner.pdf}');
select t.as_anon();
do $$ begin
  begin
    perform count(*) from users;
    raise exception 'FAIL anon: could read users';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from products;
    raise exception 'FAIL anon: could read products';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from orders;
    raise exception 'FAIL anon: could read orders';
  exception when insufficient_privilege then null; end;
end $$;
select t.ok(true, 'anon: visitors are refused users, products and orders (so no file paths or bank details)');
select t.ok((select count(*) from pricing_plans) = 3, 'rls: anonymous visitors can read active plans');
select t.as_server();

-- ── Table access rights (as on a real Supabase project) ──────────────────
select t.ok(has_table_privilege('service_role', 'public.orders', 'select,insert,update,delete')
  and has_table_privilege('service_role', 'public.payment_sessions', 'select,insert,update,delete'),
  'grants: the server can read and write every table');
select t.ok(has_table_privilege('authenticated', 'public.products', 'select,insert,update,delete')
  and not has_table_privilege('authenticated', 'public.payment_sessions', 'select'),
  'grants: vendors get the tables they use, not internal ones');
select t.ok(has_table_privilege('anon', 'public.pricing_plans', 'select')
  and not has_table_privilege('anon', 'public.products', 'select'),
  'grants: visitors can only read the price list');

-- ── Functions are server-only (C9) ───────────────────────────────────────
select t.ok(
  not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
  ),
  'functions: no public function is executable by anon or authenticated');

-- ── Orders are read-only to vendors ──────────────────────────────────────
insert into orders (id, user_id, customer_email, customer_name, total_amount, status, payment_reference, payment_status, platform_fee_amount)
values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'b@x.ng', 'Buyer', 10000, 'confirmed', 'REF-SEED', 'success', 550);
select t.as_user('00000000-0000-0000-0000-00000000000a');
update orders set total_amount = 9999999 where id = '20000000-0000-0000-0000-000000000001';
select t.as_server();
select t.ok((select total_amount from orders where id = '20000000-0000-0000-0000-000000000001') = 10000,
  'orders: vendor cannot change an order total (balance tampering)');

-- ── save_product (C2, C4, H1) ────────────────────────────────────────────
select t.ok(
  (select (save_product('00000000-0000-0000-0000-00000000000a', null,
     '{"product_type":"event","status":"published","title":"Lagos Live","price":5000,"images":[],"file_urls":[],"available_days":[],"time_slots":[],"event_date":"2030-12-20T19:00:00+01:00","event_location":"Eko"}',
     '[{"name":"Regular","price":5000,"quantity_total":2},{"name":"VIP","price":20000,"quantity_total":null}]', '[]')) ->> 'ok')::boolean,
  'save_product: event with two ticket tiers');
select t.ok((select count(*) from ticket_tiers t join products p on p.id = t.product_id where p.title = 'Lagos Live') = 2, 'save_product: tiers created');

select t.ok(
  (select (save_product('00000000-0000-0000-0000-00000000000a', null,
     '{"product_type":"physical","status":"published","title":"Tote","price":8000,"images":[],"file_urls":[],"available_days":[],"time_slots":[],"stock_quantity":5}',
     '[]', '[{"size":"M","color_name":"Indigo","color_hex":"#3344aa","stock_quantity":1},{"size":"L","color_name":null,"color_hex":null,"stock_quantity":0}]')) ->> 'ok')::boolean,
  'save_product: physical with size/colour variants');
select t.ok((select stock_quantity is null from products where title = 'Tote'), 'save_product: variant stock replaces product stock');

select t.ok(
  (select (save_product('00000000-0000-0000-0000-00000000000a', null,
     '{"product_type":"appointment","status":"published","title":"Consultation","price":15000,"images":[],"file_urls":[],"duration_minutes":60,"available_days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"start_time":"09:00","end_time":"12:00","time_slots":["09:00","10:00","11:00"]}',
     '[]', '[]')) ->> 'ok')::boolean,
  'save_product: booking with time slots');
select t.ok((select time_slots = '{09:00,10:00,11:00}' from products where title = 'Consultation'), 'save_product: time slots saved (blocker 2)');

select t.ok(
  (select (save_product('00000000-0000-0000-0000-00000000000b',
     (select id from products where title = 'Tote'),
     '{"product_type":"physical","status":"published","title":"Stolen","price":1,"images":[],"file_urls":[],"available_days":[],"time_slots":[]}', '[]', '[]')) ->> 'status')::int = 404,
  'save_product: another vendor cannot edit the product');

-- ── reserve_checkout & create_paid_order (C4, C6, C12) ───────────────────
create temp table ids as
select
  (select id from products where title = 'Tote') as tote,
  (select id from product_variants where size = 'M') as tote_m,
  (select id from products where title = 'Lagos Live') as event,
  (select id from ticket_tiers where name = 'Regular') as regular,
  (select id from products where title = 'Consultation') as booking;

select t.ok((select (reserve_checkout('R1', jsonb_build_array(jsonb_build_object('product_id', tote, 'product_variant_id', tote_m, 'quantity', 1))) ->> 'ok')::boolean from ids),
  'holds: first buyer reserves the last Tote (M)');
select t.ok((select (reserve_checkout('R2', jsonb_build_array(jsonb_build_object('product_id', tote, 'product_variant_id', tote_m, 'quantity', 1))) ->> 'ok')::boolean = false from ids),
  'holds: second buyer cannot reserve the same last item (no oversell)');
update inventory_holds set expires_at = now() - interval '1 minute' where reference = 'R1';
select t.ok((select (reserve_checkout('R3', jsonb_build_array(jsonb_build_object('product_id', tote, 'product_variant_id', tote_m, 'quantity', 1))) ->> 'ok')::boolean from ids),
  'holds: an abandoned checkout releases its hold after expiry');

select t.ok((select (reserve_checkout('B1', jsonb_build_array(jsonb_build_object('product_id', booking, 'quantity', 1, 'appointment_date', '2030-12-02', 'appointment_time', '10:00'))) ->> 'ok')::boolean from ids),
  'holds: slot reserved');
select t.ok((select (reserve_checkout('B2', jsonb_build_array(jsonb_build_object('product_id', booking, 'quantity', 1, 'appointment_date', '2030-12-02', 'appointment_time', '10:00'))) ->> 'ok')::boolean = false from ids),
  'holds: same slot cannot be reserved twice (no double booking)');

select t.ok((select (reserve_checkout('T1', jsonb_build_array(jsonb_build_object('product_id', event, 'ticket_tier_id', regular, 'quantity', 2))) ->> 'ok')::boolean from ids),
  'holds: two Regular tickets reserved');
select t.ok((select (reserve_checkout('T2', jsonb_build_array(jsonb_build_object('product_id', event, 'ticket_tier_id', regular, 'quantity', 1))) ->> 'ok')::boolean = false from ids),
  'holds: tier capacity respected');

-- Pay for T1
select t.ok((select (create_paid_order(
    jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'b@x.ng', 'customer_name', 'Buyer', 'total_amount', 10000, 'payment_reference', 'T1', 'platform_fee_amount', 550),
    jsonb_build_array(jsonb_build_object('product_id', event, 'product_title', 'Lagos Live', 'product_type', 'event', 'quantity', 2, 'price', 5000, 'subtotal', 10000, 'ticket_tier_id', regular, 'ticket_tier_name', 'Regular'))
  ) ->> 'created')::boolean from ids),
  'orders: paid checkout creates the order');
select t.ok((select (create_paid_order(
    jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'b@x.ng', 'customer_name', 'Buyer', 'total_amount', 10000, 'payment_reference', 'T1', 'platform_fee_amount', 550),
    jsonb_build_array(jsonb_build_object('product_id', event, 'product_title', 'Lagos Live', 'product_type', 'event', 'quantity', 2, 'price', 5000, 'subtotal', 10000, 'ticket_tier_id', regular, 'ticket_tier_name', 'Regular'))
  ) ->> 'created')::boolean = false from ids),
  'orders: the same payment never creates a second order (webhook + redirect)');
select t.ok((select count(*) = 1 from orders where payment_reference = 'T1') and (select count(*) = 1 from order_items oi join orders o on o.id = oi.order_id where o.payment_reference = 'T1'),
  'orders: exactly one order and one item for the reference');
select t.ok((select quantity_sold = 2 from ticket_tiers where name = 'Regular'), 'orders: ticket tier sold count applied once');
select t.ok((select bool_and(status = 'committed') from inventory_holds where reference = 'T1'), 'orders: holds committed on payment');

-- Paid after the stock was taken by someone else -> order kept but flagged
update product_variants set stock_quantity = 0 where size = 'M';
select create_paid_order(
  jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'late@x.ng', 'customer_name', 'Late Buyer', 'total_amount', 8000, 'payment_reference', 'LATE', 'platform_fee_amount', 450),
  jsonb_build_array(jsonb_build_object('product_id', tote, 'product_title', 'Tote', 'product_type', 'physical', 'quantity', 1, 'price', 8000, 'subtotal', 8000, 'product_variant_id', tote_m))
) from ids;
select t.ok((select needs_attention and attention_reason like '%Tote%' from orders where payment_reference = 'LATE'),
  'orders: payment after stock ran out is flagged for the vendor, never lost');
select t.ok((select stock_quantity = 0 from product_variants where size = 'M'), 'orders: stock never goes negative');

-- Booking paid with no live hold, slot free -> booked; then a second paid order for that slot is flagged
select create_paid_order(
  jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'c@x.ng', 'customer_name', 'C', 'total_amount', 15000, 'payment_reference', 'BK1', 'platform_fee_amount', 800),
  jsonb_build_array(jsonb_build_object('product_id', booking, 'product_title', 'Consultation', 'product_type', 'appointment', 'quantity', 1, 'price', 15000, 'subtotal', 15000, 'appointment_date', '2030-12-03', 'appointment_time', '09:00'))
) from ids;
select create_paid_order(
  jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'd@x.ng', 'customer_name', 'D', 'total_amount', 15000, 'payment_reference', 'BK2', 'platform_fee_amount', 800),
  jsonb_build_array(jsonb_build_object('product_id', booking, 'product_title', 'Consultation', 'product_type', 'appointment', 'quantity', 1, 'price', 15000, 'subtotal', 15000, 'appointment_date', '2030-12-03', 'appointment_time', '09:00'))
) from ids;
select t.ok((select not needs_attention from orders where payment_reference = 'BK1') and (select needs_attention from orders where payment_reference = 'BK2'),
  'orders: a double-booked slot is flagged instead of silently logged');

-- ── Balance, refunds and withdrawals (C10, C11) ──────────────────────────
-- Paid: REF-SEED 10000-550, T1 10000-550, LATE 8000-450, BK1 15000-800, BK2 15000-800
select t.ok(vendor_available_balance('00000000-0000-0000-0000-00000000000a') = 9450 + 9450 + 7550 + 14200 + 14200,
  'balance: paid orders net of fees', vendor_available_balance('00000000-0000-0000-0000-00000000000a')::text);
update orders set payment_status = 'refunded', refunded_at = now() where payment_reference = 'BK2';
select t.ok(vendor_available_balance('00000000-0000-0000-0000-00000000000a') = 9450 + 9450 + 7550 + 14200 - 800,
  'balance: a refunded order removes the sale and keeps the fee', vendor_available_balance('00000000-0000-0000-0000-00000000000a')::text);

select t.ok((request_withdrawal('00000000-0000-0000-0000-00000000000b', 6000) ->> 'code') = 'not_verified', 'withdraw: unverified vendor refused');
select t.ok((request_withdrawal('00000000-0000-0000-0000-00000000000a', 100) ->> 'code') = 'below_minimum', 'withdraw: below minimum refused');
select t.ok((request_withdrawal('00000000-0000-0000-0000-00000000000a', 1000000) ->> 'code') = 'insufficient', 'withdraw: more than the balance refused');
select t.ok((request_withdrawal('00000000-0000-0000-0000-00000000000a', 10000) ->> 'ok')::boolean, 'withdraw: valid withdrawal accepted');
select t.ok((select account_number = '0123456789' and status = 'pending' from withdrawal_requests limit 1), 'withdraw: paid to the saved verified account');
select t.ok(vendor_available_balance('00000000-0000-0000-0000-00000000000a') = 9450 + 9450 + 7550 + 14200 - 800 - 10000, 'withdraw: pending withdrawal reduces the balance');
update withdrawal_requests set status = 'failed';
select t.ok(vendor_available_balance('00000000-0000-0000-0000-00000000000a') = 9450 + 9450 + 7550 + 14200 - 800, 'withdraw: a failed payout returns the money to the balance');
delete from withdrawal_requests;

-- ── Tickets check-in (C3) ────────────────────────────────────────────────
insert into tickets (order_id, order_item_id, seq, product_id, vendor_id, holder_name, code)
select o.id, oi.id, 1, oi.product_id, o.user_id, 'Buyer', 'code-one'
from orders o join order_items oi on oi.order_id = o.id where o.payment_reference = 'T1';
select t.ok((check_in_ticket('code-one', '00000000-0000-0000-0000-00000000000b') ->> 'result') = 'not_found', 'check-in: another vendor cannot check in your ticket');
select t.ok((check_in_ticket('code-one', '00000000-0000-0000-0000-00000000000a', (select booking from ids)) ->> 'result') = 'wrong_event', 'check-in: ticket for a different event is refused');
select t.ok((check_in_ticket('code-one', '00000000-0000-0000-0000-00000000000a') ->> 'result') = 'checked_in', 'check-in: first scan admits');
select t.ok((check_in_ticket('code-one', '00000000-0000-0000-0000-00000000000a') ->> 'result') = 'already_used', 'check-in: second scan is refused (one-time use)');

-- ── Downloads (C7) ───────────────────────────────────────────────────────
update products set download_limit = 2 where title = 'Planner';
select create_paid_order(
  jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'customer_email', 'e@x.ng', 'customer_name', 'E', 'total_amount', 2000, 'payment_reference', 'DL1', 'platform_fee_amount', 150),
  jsonb_build_array(jsonb_build_object('product_id', '10000000-0000-0000-0000-000000000001', 'product_title', 'Planner', 'product_type', 'digital', 'quantity', 1, 'price', 2000, 'subtotal', 2000)));
create temp table dl as select download_token from order_items oi join orders o on o.id = oi.order_id where o.payment_reference = 'DL1';
select t.ok((select claim_download(download_token) ->> 'result' from dl) = 'ok', 'download: first download allowed');
select t.ok((select claim_download(download_token) ->> 'result' from dl) = 'ok', 'download: second download allowed');
select t.ok((select claim_download(download_token) ->> 'result' from dl) = 'limit_reached', 'download: limit enforced');
select t.ok((claim_download(gen_random_uuid()) ->> 'result') = 'not_found', 'download: unknown token refused');

-- ── Refunds & rescheduling (C11, H7) ─────────────────────────────────────
insert into tickets (order_id, order_item_id, seq, product_id, vendor_id, holder_name, code)
select order_id, order_item_id, 2, product_id, vendor_id, holder_name, 'code-two' from tickets where code = 'code-one';
select t.ok((mark_order_refunded((select id from orders where payment_reference = 'T1'), 'RF1') ->> 'ok')::boolean, 'refund: order marked refunded');
select t.ok((mark_order_refunded((select id from orders where payment_reference = 'T1'), 'RF1') ->> 'ok')::boolean = false, 'refund: cannot refund twice');
select t.ok((select status = 'cancelled' from tickets where code = 'code-two') and (select status = 'used' from tickets where code = 'code-one'), 'refund: unused tickets cancelled, already-used ones left as history');
select t.ok((select quantity_sold = 0 from ticket_tiers where name = 'Regular'), 'refund: ticket capacity returned');

select t.ok((reschedule_booking((select oi.id from order_items oi join orders o on o.id = oi.order_id where o.payment_reference = 'BK1'),
  '00000000-0000-0000-0000-00000000000a', '2030-12-04', '11:00') ->> 'ok')::boolean, 'reschedule: booking moved to a free slot');
select t.ok((select (reserve_checkout('B9', jsonb_build_array(jsonb_build_object('product_id', booking, 'quantity', 1, 'appointment_date', '2030-12-03', 'appointment_time', '09:00'))) ->> 'ok')::boolean from ids),
  'reschedule: the old slot is free again');
select t.ok((reschedule_booking((select oi.id from order_items oi join orders o on o.id = oi.order_id where o.payment_reference = 'BK1'),
  '00000000-0000-0000-0000-00000000000a', '2030-12-03', '09:00') ->> 'ok')::boolean = false, 'reschedule: cannot move into a taken slot');
select t.ok((reschedule_booking((select oi.id from order_items oi join orders o on o.id = oi.order_id where o.payment_reference = 'BK1'),
  '00000000-0000-0000-0000-00000000000b', '2030-12-05', '10:00') ->> 'message') = 'Booking not found.', 'reschedule: another vendor cannot move it');

-- ── Rate limit ───────────────────────────────────────────────────────────
select t.ok(hit_rate_limit('k', 60, 2) and hit_rate_limit('k', 60, 2) and not hit_rate_limit('k', 60, 2), 'rate limit: third request in window refused');

-- ── Storage ──────────────────────────────────────────────────────────────
select t.ok((select not public from storage.buckets where id = 'digital-files'), 'storage: paid files bucket is private');
select t.as_user('00000000-0000-0000-0000-00000000000a');
insert into storage.objects (bucket_id, name) values ('product-images', '00000000-0000-0000-0000-00000000000a/a.jpg');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', '00000000-0000-0000-0000-00000000000b/x.jpg');
    raise exception 'FAIL storage: upload into another vendor''s folder was allowed';
  exception when insufficient_privilege then null; end;
end $$;
select t.ok(true, 'storage: vendors can only upload into their own folder');
select t.as_server();

\o
\echo ALL DATABASE TESTS PASSED
