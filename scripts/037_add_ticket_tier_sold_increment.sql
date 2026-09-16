-- Atomic "quantity left" decrement for ticket tiers, called from fulfilment after
-- payment succeeds. A guarded UPDATE avoids a read-then-write race between two
-- concurrent buyers of the same tier.
CREATE OR REPLACE FUNCTION public.increment_ticket_tier_sold(p_tier_id UUID, p_qty INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE public.ticket_tiers
  SET quantity_sold = quantity_sold + p_qty
  WHERE id = p_tier_id
    AND (quantity_total IS NULL OR quantity_sold + p_qty <= quantity_total)
  RETURNING true INTO updated;

  RETURN COALESCE(updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
