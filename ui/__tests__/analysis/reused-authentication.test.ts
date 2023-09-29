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
        dst: '10.1.0.96',
        src1_traffic_id: '2',
        src1_ip: '3.0.0.0',
        src1_lat: '41.1682',
        src1_long: '-73.2689',
        src1_country: 'US',
        src1_error: 20,
        src2_traffic_id: '2',
        src2_ip: '1.0.0.0',
        src2_lat: '-33.4940',
        src2_long: '143.2104',
        src2_country: 'AU',
        src2_error: 1000,
        dist: 16705.07713397242,
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
                country: 'US',
                dst: '10.1.0.96',
                error: 20,
                id: '2',
                lat: '41.1682',
                long: '-73.2689',
                src: '3.0.0.0',
              },
              {
                country: 'AU',
                dst: '10.1.0.96',
                error: 1000,
                id: '2',
                lat: '-33.4940',
                long: '143.2104',
                src: '1.0.0.0',
              },
            ],
            maxDist: {
              dist: 16705.07713397242,
              dst: '10.1.0.96',
              error: 1020,
              src1_country: 'US',
              src1_ip: '3.0.0.0',
              src1_lat: '41.1682',
              src1_long: '-73.2689',
              src1_traffic_id: '2',
              src2_country: 'AU',
              src2_ip: '1.0.0.0',
              src2_lat: '-33.4940',
              src2_long: '143.2104',
              src2_traffic_id: '2',
            },
          },
        },
      },
    ],
  });
});
