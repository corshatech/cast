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
  data jsonb
);

CREATE INDEX IF NOT EXISTS idx_traffic_data ON traffic USING gin (data);
CREATE INDEX IF NOT EXISTS idx_auth_header ON traffic USING BTREE (data->'request'->'headers'->>'Authorization');
CREATE INDEX IF NOT EXISTS idx_auth_header_src ON traffic USING BTREE (data->'request'->'headers'->>'Authorization', data->'src');

-- The pass_in_url table is used by the analysis/pass_in_url package
-- DROP TABLE IF EXISTS pass_in_url
-- If the row exists, that means the traffic entry has a password in the URL
CREATE TABLE IF NOT EXISTS pass_in_url (
  traffic_id uuid,
  field text
);
