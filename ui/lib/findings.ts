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

import { z } from 'zod';
import { logger } from './internal';

/** A human-readable string which accepts Markdown */
export type MDString = string;

/** Defined to be a string containing a date in UTC-aligned RFC-3339 format */
export type DateString = string;

export const Severity = z.union([
  z.literal('none'),
  z.literal('low'),
  z.literal('medium'),
  z.literal('high'),
  z.literal('critical'),
]).describe('The set of CVSS Severity levels');

export type Severity = z.infer<typeof Severity>;

export const Analysis = z.object({
  id: z.string().nonempty().describe('Human-friendly but machine-readable ID for analysis kind; e.g. CAST-C-103'),
  title: z.string().describe('Human-readable title for analysis kind'),
  description: z.string().describe('Human-readable description of what the analysis is and does'),
  reportedAt: z.string().datetime().describe('Time that this analysis completed'),
  weaknessLink: z.string().url().optional().describe('URL for authoritative source covering weakness; i.e. CVE, CWE, or OWASP link'),
  weaknessTitle: z.string().nonempty().optional().describe('Human-readable title of weakness ID or link; e.g. if it\'s a CWE, then this is something like CWE-489'),
  severity: Severity,
  findings: z.array(z.any()),
});

export type Analysis = z.infer<typeof Analysis>;

export interface AnalysesSummary {
  faults: number,
  scansPassed: number,
  findings: number,
  severityCounts: Record<Severity, number>;
}

export const OccurredAt = z.union([
  z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  z.object({
    at: z.string().datetime(),
  }),
]);

export type OccurredAt = z.infer<typeof OccurredAt>;

export const IFinding = z.object({
  type: z.string().nonempty().describe('Internal type ID for finding kind'),
  name: z.string().nonempty().describe('Human-readable name of finding type'),
  occurredAt: OccurredAt.optional().describe(`When the infraction occurred

An RFC3339-format timestamp or range. Optional. If present, represents
the time that an infraction occurred, if available and if
different from DetectedAt. For example, when examining API logs,
OccurredAt may indicate the timestamp from the logs while
DetectedAt indicates the time that CAST processed the incident.`),
  detectedAt: z.string().datetime().describe('The time when this finding was generated'),
  severity: Severity,
  data: z.record(z.any()).describe('Contextual data describing the particular finding. Contents may vary by finding kind.'),
})

export type IFinding = z.infer<typeof IFinding>;

/**
 * Utility function to avoid repeated typing of extending the Finding type.
 *
 * Creates a specific Finding type and parser by extending
 * the interface IFinding and overriding it with:
 * (1) the literal type given as the param `type`, and
 * (2) a specific `data` record given as the 2nd param `data`, provided as a
 * Zod schema.
 */
export function makeFinding<
  Type extends string,
  DataSchema extends z.ZodSchema<Record<string, any>>
>(
  type: Type,
  dataSchema: DataSchema,
) {
  return IFinding.extend({
    type: z.literal<Type>(type),
    data: dataSchema,
  });
}

export const RequestContext = z.object({
  srcIp: z.string().ip().describe('The source IP address'),
  srcPort: z.string().regex(/[0-9]+/).describe('The source port number'),
  proto: z.union([
    z.literal('tcp'),
    z.literal('udp'),
    z.literal('unknown'),
  ]),
  destIp: z.string().ip().describe('The destination IP address'),
  destPort: z.string().regex(/[0-9]+/).describe('The destination port number'),
  URI: z.string().url().optional().describe('The resource URI being accessed, if applicable'),
  at: z.string().datetime().describe('The time this request occurred'),
}).describe('The context describing an instance of an API request');

export type RequestContext = z.infer<typeof RequestContext>;

export const ReusedAuthentication = makeFinding(
  'reused-auth',
  z.object({
    auth: z.string().describe('The identifier for the particular reused authentication'),
    inRequests: z.array(RequestContext.extend({ count: z.number() })),
  }),
)
export type ReusedAuthentication = z.infer<typeof ReusedAuthentication>;

export const ExpiredJWT = makeFinding(
  'expired-jwt',
  z.object({
    jwt: z.string().describe('The JWT of concern'),
    expiredAt: z.string().datetime().describe('DateString formatted timestamp of when the JWT expired'),
    inRequest: RequestContext,
  }),
);

export type ExpiredJWT = z.infer<typeof ExpiredJWT>;

export const PasswordInURL = makeFinding(
  'pass-in-url',
  z.object({
    queryParams: z.array(z.string()).describe('The name of the query parameter suspected of containing a password'),
    inRequest: RequestContext,
  }),
);

export type PasswordInURL = z.infer<typeof PasswordInURL>

export const UseOfBasicAuth = makeFinding(
  'use-of-basic-auth',
  z.object({
    inRequest: RequestContext,
  }),
);

export type UseOfBasicAuth = z.infer<typeof UseOfBasicAuth>

export const RequestTooSlow = makeFinding(
  'request-too-slow',
  z.object({
    elapsedTime: z.number().describe('The total time the request took'),
    inRequest: RequestContext,
  }),
);

export type RequestTooSlow = z.infer<typeof RequestTooSlow>

export type Finding =
  | ReusedAuthentication
  | ExpiredJWT
  | PasswordInURL
  | UseOfBasicAuth
  | RequestTooSlow;

export function AnalysisOf<Thing extends z.ZodObject<any>>(finding: Thing) {
  return Analysis.extend({
    // workaround to pass-through the literal 'type' keys from findings onto the
    // resulting Analysis
    id: finding.shape.type as Thing['shape']['type'],
    findings: z.array(finding),
  });
}

export type AnalysisOf<Thing extends IFinding> =
  // Analysis sans 'id' and 'findings' (wasn't narrowing properly, even on
  // intersection?)
  Omit<Analysis, 'findings' | 'id'>
  // plus these well-typed findings and id.
  & {
    id: Thing['type'],
    findings: Thing[],
  };

/** A function that produces an analysis result */
export type AnalysisFunction = () => Promise<Analysis[]>;

async function runWithFailuresAsEmpty<T>(f: () => Promise<T[]>): Promise<T[]> {
  try {
    return await f();
  } catch (error) {
    logger.error({error}, 'Error running analysis function');
  }
  return [];
}

/** Evaluates all analysis functions */
export async function runAllAnalyses(
  analyses: AnalysisFunction[],
): Promise<Analysis[]> {
  const promises = analyses.map(runWithFailuresAsEmpty);
  const result = Promise.all(promises);
  return (await result).flat();
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
    if (findingsCount > 0) {
      findings += findingsCount;
      faults++;
      severityCounts[analysis.severity]++;
    } else {
      scansPassed++;
    }
    if (analysis.id === 'reused-auth') {
      findings +=
        analysis.findings.reduce(
          (acc, curr) => (acc += curr.data.inRequests.length),
          0,
        ) - analysis.findings.length;
    }
  });

  return {
    faults,
    findings,
    scansPassed,
    severityCounts,
  }
}
