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

/** A human-readable string which accepts Markdown */
export type MDString = string;

/** Defined to be a string containing a date in UTC-aligned RFC-3339 format */
export type DateString = string;

export type OccurredAt =
  | {
    start: DateString;
    end: DateString;
  }
  | {
    at: DateString;
  };

/** The set of severity levels */
export const Severity = ['none', 'low', 'medium', 'high', 'critical'] as const;

/** The severity of a finding. */
export type Severity = (typeof Severity)[number];

export interface Analysis {
  /** Human-friendly machine-readable ID for analysis kind; e.g. CAST-C-103 */
  id: string;
  /** Human-readable title for analysis kind */
  title: string;
  /** Human-readable description for analysis. */
  description: MDString;
  /** Time that this analysis completed */
  reportedAt: DateString;
  /** URL for authoritative source covering weakness; i.e. CVE or CWE or OWASP link */
  weaknessLink?: string;
  /** Human-readable title of weakness ID/link; e.g. if it"s a CWE,
   * this is something like "CWE-439" */
  weaknessTitle?: string;
  /** Severity of failed analysis; must not be "lower" than the
   * severity of any of the individual findings contained within */
  severity: Severity;
  /** Findings reported by this analysis, if any. Omitted if empty. */
  findings?: Finding[];
}

export interface AnalysesSummary {
  faults: number,
  scansPassed: number,
  findings: number,
  severityCounts: Record<Severity, number>;
}

export type IFinding<
  Type extends string,
  DataType extends Record<string, any>,
> = {
  /** Internal type ID; belongs to the set of finding kinds */
  type: Type;
  /** Human-readable "name" of finding type */
  name: string;
  /**
   * When the infraction occurred
   *
   * An RFC3339-format timestamp or range. Optional. If present, represents
   * the time that an infraction occurred, if available and if
   * different from DetectedAt. For example, when examining API logs,
   * OccurredAt may indicate the timestamp from the logs while
   * DetectedAt indicates the time that CAST processed the
   * incident.
   */
  occurredAt?: OccurredAt;
  /**
   * The time when this Finding was generated
   * An RFC3339-format timestamp of when this Finding was generated internally by CAST
   */
  detectedAt: DateString;

  severity: Severity;
  /** Contextual data describing the particular finding. Particular
   * contents varies by finding kind. */
  data: DataType;
};

export interface RequestContext {
  srcIp: string;
  srcPort: string;
  proto: 'tcp' | 'udp' | 'unknown';
  destIp: string;
  destPort: string;
  URI?: string;
  at: DateString;
}

export type ReusedAuthentication = IFinding<
  'reused-auth',
  {
    /** The identifier for the particular reused authentication */
    auth: string;
    /** Minimum 2 RequestContext[], at least one unique record per srcIp
     * involved in the auth sharing. */
    inRequests: (RequestContext & { count: number })[];
  }
>;

export type ExpiredJWT = IFinding<
  'expired-jwt',
  {
    /** The JWT of concern */
    jwt: string;
    /** DateString formatted timestamp of when the JWT expired */
    expiredAt: DateString;
    inRequest: RequestContext;
  }
>;

export type PasswordInURL = IFinding<'pass-in-url', {
  /** The name of the query parameter suspected of containing a password. */
  queryParams: string[];
  /**
   * The request that triggered this finding. In-particular,
   * the URI of this request should have a best-effort scrub to not contain
   * the credential in the finding report; only report the suspicion of it
   * containing a credential.
   */
  inRequest: RequestContext;
}>;

export type UseOfBasicAuth = IFinding<
  'use-of-basic-auth',
  {
    inRequest: RequestContext;
  }
>;

export type Finding =
  | ReusedAuthentication
  | ExpiredJWT
  | PasswordInURL
  | UseOfBasicAuth;

/** A function that produces an analysis result */
export type AnalysisFunction = () => Promise<Analysis>;

/** Evaluates all analysis functions */
export async function runAllAnalyses(
  analyses: AnalysisFunction[],
): Promise<Analysis[]> {
  const promises = analyses.map((f) => f());
  return Promise.all(promises);
}

export function summarizeAnalyses(analyses: Analysis[]): AnalysesSummary {
  let faults = 0;
  let findings = 0;
  let scansPassed = 0;
  let severityCounts = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  analyses.forEach(analysis => {
    const findingsCount = (analysis.findings ?? []).length;
    if (findingsCount) {
      findings += findingsCount;
      faults++;
      severityCounts[analysis.severity]++;
    } else {
      scansPassed++;
    }
  });

  return {
    faults,
    findings,
    scansPassed,
    severityCounts,
  }
}
