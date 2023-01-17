/* Copyright 2022 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

/**
 * Analysis describes the results of an analysis type
 **/
export interface Analysis {
  /** A machine-friendly ID identifying the CAST analysis, e.g. C-104-reused-auth */
  id: string;

  /** Human-readable name of analysis */
  name: string;

  /** Human-readable description of what the analysis is */
  description: string;

  /** A number used for sorting analyses in the UI, sorted ascending */
  priority: number;

  /** The result of the analysis */
  findings: Finding[];
}

/** The set of severity levels */
export const Severity = ["none", "low", "medium", "high", "critical"] as const;
/** The severity of a finding. */
export type Severity = typeof Severity[number];

export interface Finding {
  /** Internal identifier for the finding */
  id: string;

  /** Internal type label for the finding */
  type: string;

  /** Human readable name for the Type - frontend */
  name: string;

  /** Human-readable brief description of finding / infraction */
  description: string;

  severity: Severity;

  /**
   * A raw string field that can be used to display additional
   * free-form information in the UI about the finding in
   * CommonMark */
  detail: string;
}

/** 
    Evaluates and sort all analyses in ascending order based on priority
*/
export type AnalysisFunction = () => Promise<Analysis>;

export async function runAllAnalyses(analyses: AnalysisFunction[]): Promise<Analysis[]> {
  const promises = analyses.map(f => f());
  const result = await Promise.all(promises);
  return result.sort((x, y) => x.priority - y.priority);
}
