/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

/** CAST Metadata extracted from the accompanying request */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type CASTMetadata = {
  /**
   * JWT strings detected in the request, if any present.
   * Strings in this list may not necessarily be in any particular order,
   * and need not be unique in the event the request contains duplicate JWTs somehow.
   * (i.e. Neither list order nor unique items guaranteed.)
   */
  // eslint-disable-next-line max-len
  detectedJWTs?: string[]; // Empty-array is not permitted in transit; empty value should be omit instead to save data in the backend
};
