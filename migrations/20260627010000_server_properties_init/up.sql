CREATE TABLE IF NOT EXISTS ext_server_properties_settings (
    id integer PRIMARY KEY DEFAULT 1,
    allowed_egg_uuids uuid[] NOT NULL DEFAULT '{}'::uuid[],
    updated timestamp NOT NULL DEFAULT NOW(),
    CHECK (id = 1)
);

INSERT INTO ext_server_properties_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
