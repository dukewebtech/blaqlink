-- Vendors name their two variant options themselves (Size, Colour,
-- Material, Flavour, ...). Existing products keep Size and Colour.
-- variants.size holds option 1's value and variants.color_name option 2's.

alter table public.products
  add column if not exists option1_name text not null default 'Size'
    check (char_length(option1_name) between 1 and 30),
  add column if not exists option2_name text not null default 'Colour'
    check (char_length(option2_name) between 1 and 30);

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
    booking_link = p_product ->> 'booking_link',
    option1_name = case when v_type = 'physical'
                        then coalesce(nullif(trim(p_product ->> 'option1_name'), ''), 'Size') else 'Size' end,
    option2_name = case when v_type = 'physical'
                        then coalesce(nullif(trim(p_product ->> 'option2_name'), ''), 'Colour') else 'Colour' end
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

-- create or replace keeps the existing grants (server only).
