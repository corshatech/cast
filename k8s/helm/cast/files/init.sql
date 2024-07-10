-- Copyright 2022 Corsha.
-- Licensed under the Apache License, Version 2.0 (the 'License');
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--       http://www.apache.org/licenses/LICENSE-2.0
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an 'AS IS' BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- DROP TABLE IF EXISTS traffic;
CREATE TABLE IF NOT EXISTS traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz,
  data jsonb,
  meta jsonb
);

CREATE TABLE IF NOT EXISTS plugins_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz DEFAULT now(),
  plugin_name text
);

CREATE TABLE IF NOT EXISTS plugins_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz DEFAULT now(),
  plugin_name text,
  data jsonb
);

CREATE TABLE IF NOT EXISTS feodo_banlist (
  id decimal PRIMARY KEY,
  ip_address text NOT NULL,
  country text,
  first_seen timestamp,
  last_online timestamp,
  malware text
);

-- Schemas provided by Maxmind:
-- https://dev.maxmind.com/geoip/importing-databases/postgresql

CREATE TABLE IF NOT EXISTS geo_ip_data (
  network cidr NOT NULL,
  geoname_id int,
  registered_country_geoname_id int,
  represented_country_geoname_id int,
  is_anonymous_proxy bool,
  is_satellite_provider bool,
  postal_code text,
  latitude numeric,
  longitude numeric,
  accuracy_radius int,
  is_anycast bool
);

CREATE TABLE geo_location_data (
  geoname_id int NOT NULL,
  locale_code text NOT NULL,
  continent_code text NOT NULL,
  continent_name text NOT NULL,
  country_iso_code text,
  country_name text,
  subdivision_1_iso_code text,
  subdivision_1_name text,
  subdivision_2_iso_code text,
  subdivision_2_name text,
  city_name text,
  metro_code int,
  time_zone text,
  is_in_european_union bool NOT NULL,
  PRIMARY KEY (geoname_id, locale_code)
);

CREATE INDEX IF NOT EXISTS idx_traffic_data ON traffic USING gin (data);
CREATE INDEX IF NOT EXISTS idx_auth_header ON traffic USING BTREE ((data->'request'->'headers'->>'Authorization'));
CREATE INDEX IF NOT EXISTS idx_auth_header_src ON traffic USING BTREE ((data->'request'->'headers'->>'Authorization'), (data->'src'));
CREATE INDEX IF NOT EXISTS idx_geo_ip_data_network ON geo_ip_data USING gist (network inet_ops);

CREATE TABLE traffic_ips (
  traffic_id uuid REFERENCES traffic(id),
  direction text,
  ip_addr text
);

CREATE FUNCTION traffic_ips_insert() RETURNS TRIGGER
  LANGUAGE PLPGSQL AS
$$
BEGIN
  INSERT INTO traffic_ips VALUES(NEW.id, 'src', NEW.data->'src'->>'ip');
  INSERT INTO traffic_ips VALUES(NEW.id, 'dst', NEW.data->'dst'->>'ip');
  IF NEW.data->'request'->'headers'->>'X-Forwarded-For' IS NOT NULL THEN
    INSERT INTO traffic_ips VALUES(NEW.id, 'src', TRIM(UNNEST(STRING_TO_ARRAY(NEW.data->'request'->'headers'->>'X-Forwarded-For', ',')), '"[] '));
  END IF;
  IF NEW.data->'request'->'headers'->>'X-Real-Ip' IS NOT NULL THEN
    INSERT INTO traffic_ips VALUES(NEW.id, 'src', TRIM(UNNEST(STRING_TO_ARRAY(NEW.data->'request'->'headers'->>'X-Real-Ip', ',')), '"[] '));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER traffic_ips_insert_trigger
  AFTER INSERT ON traffic
  FOR EACH ROW
  EXECUTE PROCEDURE traffic_ips_insert();
