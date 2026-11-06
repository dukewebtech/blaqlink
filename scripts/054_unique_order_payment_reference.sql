-- One order per payment. The verify route and the webhook both create orders
-- after a check-then-insert, so without this two concurrent requests for the
-- same reference can each insert an order.
--
-- If this fails with a duplicate-key error, find the duplicates first:
--   SELECT payment_reference, COUNT(*) FROM orders
--   WHERE payment_reference IS NOT NULL
--   GROUP BY payment_reference HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_reference_key
  ON orders (payment_reference)
  WHERE payment_reference IS NOT NULL;
