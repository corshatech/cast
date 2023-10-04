import { LocationDatum } from '@/lib/findings';
import { runnerPure } from '../../lib/analysis/reused-authentication';

test('runner works', async () => {
  const query = () =>
    Promise.resolve([
      {
        id: '1',
        auth: 'auth-header-1',
        count: 2,
        min_timestamp: new Date('2023-01-18T13:12:00.000Z'),
        max_timestamp: new Date('2023-01-18T13:12:02.000Z'),
        src_ip: '192.2.0.1',
        src_port: '57944',
        dst_ip: '10.1.0.96',
        dst_port: '8181',
        uri: 'http://example.com/url-2',
        timestamp: new Date('2023-01-18T13:12:01.000Z'),
      },
      {
        id: '2',
        auth: 'auth-header-1',
        count: 1,
        min_timestamp: new Date('2023-01-18T13:12:00.000Z'),
        max_timestamp: new Date('2023-01-18T13:12:02.000Z'),
        src_ip: '192.2.0.2',
        src_port: '57944',
        dst_ip: '10.1.0.96',
        dst_port: '8181',
        uri: 'http://example.com/url-1',
        timestamp: new Date('2023-01-18T13:12:02.000Z'),
      },
    ]);
  const geoIPQuery = () => 
    Promise.resolve([
      {
        auth: 'auth-header-1',
        traffic_id: '2',
        direction: 'src' as LocationDatum['direction'],
        ip_addr: '3.0.0.0',
        latitude: 41.1682,
        longitude: -73.2689,
        error: 20,
        country_code: 'US',
        max_auth: null,
        max_dist: null,
        max_error: null,
      },
      {
        auth: 'auth-header-1',
        traffic_id: '2',
        direction: 'src' as LocationDatum['direction'],
        ip_addr: '1.0.0.0',
        latitude: -33.4940,
        longitude: 143.2104,
        error: 1000,
        country_code: 'AU',
        max_auth: null,
        max_dist: null,
        max_error: null,
      },
      {
        auth: null,
        traffic_id: null,
        direction: null,
        ip_addr: null,
        latitude: null,
        longitude: null,
        error: null,
        country_code: null,
        max_auth: 'auth-header-1',
        max_dist: 16705.07713397242,
        max_error: 1020,
      },
    ])
  const results = await runnerPure(query, geoIPQuery);
  expect(results).toStrictEqual({
    id: 'reused-auth',
    title: 'Broken Authentication: Reused Authorization',
    description:
      'Multiple clients were detected using the same Authorization HTTP ' +
      'header value. Clients who use the same authorization header could be ' +
      'evidence of stolen credentials. Make use of short-lived, per-device ' + 
      'credentials and ensure they are not shared across sessions, ' +
      'workloads, or devices.',
    reportedAt: '2023-01-17T13:12:00.000Z',
    severity: 'medium',
    weaknessLink: 'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    weaknessTitle: '(OWASP) API2:2023 Broken Authentication',
    findings: [
      {
        type: 'reused-auth',
        name: 'Broken Authentication: Reused Authorization',
        occurredAt: {
          start: '2023-01-18T13:12:00.000Z',
          end: '2023-01-18T13:12:02.000Z',
        },
        detectedAt: '2023-01-17T13:12:00.000Z',
        severity: 'medium',
        data: {
          auth: 'auth-header-1',
          inRequests: [
            {
              id: '1',
              count: 2,
              srcIp: '192.2.0.1',
              srcPort: '57944',
              destIp: '10.1.0.96',
              destPort: '8181',
              proto: 'tcp',
              URI: 'http://example.com/url-2',
              at: '2023-01-18T13:12:01.000Z',
            },
            {
              id: '2',
              count: 1,
              srcIp: '192.2.0.2',
              srcPort: '57944',
              destIp: '10.1.0.96',
              destPort: '8181',
              proto: 'tcp',
              URI: 'http://example.com/url-1',
              at: '2023-01-18T13:12:02.000Z',
            },
          ],
          geoIP: {
            geoLocation: [
              {
                countryCode: 'US',
                direction: 'src',
                error: 20,
                trafficId: '2',
                latitude: 41.1682,
                longitude: -73.2689,
                ipAddr: '3.0.0.0',
              },
              {
                countryCode: 'AU',
                direction: 'src',
                error: 1000,
                trafficId: '2',
                latitude: -33.4940,
                longitude: 143.2104,
                ipAddr: '1.0.0.0',
              },
            ],
            maxDist: 16705.07713397242,
            maxError: 1020,
          },
        },
      },
    ],
  });
});
