-- Fix production_requirements column types (V116 had incorrect DECIMAL type)
ALTER TABLE production_requirements 
ALTER COLUMN custom_size_width TYPE DOUBLE PRECISION,
ALTER COLUMN custom_size_height TYPE DOUBLE PRECISION;
