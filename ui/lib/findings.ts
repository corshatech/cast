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

// Severity of geoip distance in kilometers
export const CRITICAL_SEVERITY_DISTANCE = 1000;
export const HIGH_SEVERITY_DISTANCE = 100;

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
  srcCountryCode: z.string().optional().describe('The source country code found from location data (if exists)'),
  srcLat: z.string().optional().describe('Decimal number with WGS84 latitude for the source IP'),
  srcLong: z.string().optional().describe('Decimal number with WGS84 longitude for the source IP'),
  proto: z.union([
    z.literal('tcp'),
    z.literal('udp'),
    z.literal('unknown'),
  ]),
  destIp: z.string().ip().describe('The destination IP address'),
  destPort: z.string().regex(/[0-9]+/).describe('The destination port number'),
  destCountryCode: z.string().optional().describe('The destination country code found from location data (if exists)'),
  destLat: z.string().optional().describe('Decimal number with WGS84 latitude for the destination IP'),
  destLong: z.string().optional().describe('Decimal number with WGS84 longitude for the destination IP'),
  URI: z.string().url().optional().describe('The resource URI being accessed, if applicable'),
  at: z.string().datetime().describe('The time this request occurred'),
}).describe('The context describing an instance of an API request');

export type RequestContext = z.infer<typeof RequestContext>;

export const ReusedAuthRequest = z.object({
  trafficId: z.string().describe('The traffic ID assigned by the collector'),
  at: z.string().datetime().describe('The time this request occurred'),
  direction: z.union([
    z.literal('src'),
    z.literal('dst'),
  ]).describe('Whether this traffic item is a source or destination IP'),
  ipAddr: z.string().describe('IP address found in request'),
  port: z.string().describe('IP address found in request'),
  latitude: z.string().optional().describe('Decimal number with WGS84 latitude'),
  longitude: z.string().optional().describe('Decimal number with WGS84 longitude'),
  error: z.number().optional().describe('Number in kilometers of accuracy radius for geo point'),
  countryCode: z.string().optional().describe('Two character country code (ISO 3166-1)'),
})

export type ReusedAuthRequest = z.infer<typeof ReusedAuthRequest>;

export const ReusedAuthentication = makeFinding(
  'reused-auth',
  z.object({
    auth: z.string().describe('The identifier for the particular reused authentication'),
    uri: z.string().describe('The resource URI being accessed, if applicable'),
    count: z.number().describe('Number of times a resource was accessed with this same secret'),
    maxDist: z.number().optional().describe('Distance between two farthest found points in kilometers'),
    maxError: z.number().optional().describe('Combined accuracy radius for points with max distance'),
    requests: z.array(ReusedAuthRequest),
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

export const RegexPattern = z.object({
  'Id': z.string(),
  'DetectedAt': z.string(),
  'Rule': Analysis.pick({
    title: true,
    severity: true,
    description: true,
    weaknessLink: true,
    weaknessTitle: true,
  }).extend({
    sensitive: z.boolean(),
  }),
  'MatchText': z.string(),
  'AbsoluteUri': z.string(),
})

export type RegexPattern = z.infer<typeof RegexPattern>;

export const RegexFinding = makeFinding(
  'regex-pattern',
  z.object({
    description: z.string(),
    weaknessLink: z.string(),
    weaknessTitle: z.string(),
    inRequest: RequestContext,
  }),
);

export type RegexFinding = z.infer<typeof RegexFinding>

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

export type RequestTooSlow = z.infer<typeof RequestTooSlow>;

export const IpBanlist = makeFinding(
  'ip-banlist',
  z.object({
    specificAddress: z.string().ip(),
    country: z.string().optional(),
    malware: z.string().optional(),
    inRequest: RequestContext,
  }),
);

export type IpBanlist = z.infer<typeof IpBanlist>;

export type Finding =
  | ReusedAuthentication
  | ExpiredJWT
  | RegexFinding
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
          (acc, curr) => (acc += curr.data.requests.length),
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
