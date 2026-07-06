-- Cards
UPDATE product_field_configs
SET custom_dimensions = '["width","height"]'::jsonb, custom_dimension_unit = 'mm'
WHERE field_key = 'size' AND allow_custom = true
AND service_type_id IN (1, 53, 54, 62, 63, 64);

-- Stickers
UPDATE product_field_configs
SET custom_dimensions = '["width","height"]'::jsonb, custom_dimension_unit = 'mm'
WHERE field_key = 'size' AND allow_custom = true
AND service_type_id IN (111, 112, 113, 114, 115, 117);

-- Cake Base (79)
UPDATE product_field_configs
SET custom_dimensions = '["width","height"]'::jsonb, custom_dimension_unit = 'mm'
WHERE field_key = 'size' AND allow_custom = true
AND service_type_id = 79;

-- Calendars, Envelope, Diary, Doctor File, Pamphlet, Brochure — text mode
UPDATE product_field_configs
SET custom_size_mode = 'text'
WHERE field_key = 'size' AND allow_custom = true
AND service_type_id IN (5, 6, 7, 9, 10, 11, 122, 123, 124, 125);

-- Reflector Flex — text mode
UPDATE product_field_configs
SET custom_size_mode = 'text'
WHERE field_key = 'size' AND allow_custom = true
AND service_type_id = 108;
