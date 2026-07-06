ALTER TABLE leaves
    ALTER COLUMN no_of_days TYPE NUMERIC(5,2) USING no_of_days::numeric;
