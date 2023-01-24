/* Copyright 2023 Corsha.
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

  /** An RFC3339-format timestamp of when this analysis most recently
   * completed executing; i.e. its last-updated time */
  lastUpdated: string;

  /** The result of the analysis */
  findings: Finding[];
}

/** The set of severity levels */
export const Severity = ["none", "low", "medium", "high", "critical"] as const;

/** The severity of a finding. */
export type Severity = typeof Severity[number];

/** When a finding occurred. It might be a time span or at an instant */
export type OccurredAt =
  | {
    /** The start date and time formatted as a UTC RFC-3339 string */
    start: string;

    /** The end date and time formatted as a UTC RFC-3339 string */
    end: string;
  }
  | {
    /** The instant the finding occurred formatted as a UTC RFC-3339 string */
    at: string;
  };

export interface Finding {
  /** Internal identifier for the finding */
  id: string;

  /** Internal type label for the finding */
  type: string;

  /** Human readable name for the Type - frontend */
  name: string;

  /** Human-readable brief description of finding / infraction */
  description: string;

  /** When the infraction occurred
   *
   * An RFC3339-format timestamp. Optional. If present, represents
   * the time that an infraction occurred, if available and if
   * different from DetectedAt. For example, when examining API logs,
   * OccurredAt may indicate the timestamp from the logs while
   * DetectedAt indicates the time that CAST processed the
   * incident.
   */
  occurredAt?: OccurredAt;

  /** The time when this Finding was generated
   *
   * An RFC3339-format timestamp of when this Finding was generated internally by CAST; i.e.
   */
  detectedAt: string;

  /** How severe the finding is */
  severity: Severity;

  /** The detailed human-readable report
   *
   * A raw string field that can be used to display additional
   * free-form information in the UI about the finding in
   * Github-flavored Markdown */
  detail: string;
}

/** A function that produces an analysis result */
export type AnalysisFunction = () => Promise<Analysis>;

/** Evaluates all analysis functions */
export async function runAllAnalyses(analyses: AnalysisFunction[]): Promise<Analysis[]> {
  const promises = analyses.map(f => f());
  return await Promise.all(promises);
}
