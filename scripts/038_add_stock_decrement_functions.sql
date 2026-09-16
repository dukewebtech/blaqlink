-- Atomic stock decrements for physical products, called from fulfilment after
-- payment succeeds. Not one of the four fulfilment actions requested directly,
-- but without this the size/colour stock added earlier would never move.
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_qty INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_variant_id
    AND stock_quantity >= p_qty
  RETURNING true INTO updated;

  RETURN COALESCE(updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_qty INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_product_id
    AND stock_quantity IS NOT NULL
    AND stock_quantity >= p_qty
  RETURNING true INTO updated;

  RETURN COALESCE(updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
