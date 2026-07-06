CREATE TABLE IF NOT EXISTS dimension_masters (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_masters (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO dimension_masters (name) VALUES
    ('Width'), ('Height'), ('Depth'), ('Length'), ('Diameter'), ('Gusset')
ON CONFLICT (name) DO NOTHING;

INSERT INTO unit_masters (name) VALUES
    ('mm'), ('cm'), ('inch'), ('ft'), ('gsm'), ('kg'), ('ml'), ('pcs')
ON CONFLICT (name) DO NOTHING;
