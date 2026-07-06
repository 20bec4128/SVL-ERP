-- Backfill new vendor service mapping columns from legacy columns.
-- Legacy mapping used:
--   product_ids -> service_category_ids
--   brand_ids   -> service_type_ids

UPDATE vendor
SET service_category_ids = product_ids
WHERE (service_category_ids IS NULL OR btrim(service_category_ids) = '')
  AND product_ids IS NOT NULL
  AND btrim(product_ids) <> '';

UPDATE vendor
SET service_type_ids = brand_ids
WHERE (service_type_ids IS NULL OR btrim(service_type_ids) = '')
  AND brand_ids IS NOT NULL
  AND btrim(brand_ids) <> '';

