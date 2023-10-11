import { ReusedAuthRequest } from '@/lib/findings';
import { runnerPure } from '../../lib/analysis/reused-authentication';

test('runner works', async () => {
  const query = () =>
    Promise.resolve([
      {
        auth: 'auth-header-1',
        count: 2,
        uri: 'http://example.com/url-2',
      },
      {
        auth: 'auth-header-1',
        count: 1,
        uri: 'http://example.com/url-1',
      },
    ]);
  const requestsQuery = () => 
    Promise.resolve([
      {
        auth: 'auth-header-1',
        traffic_id: '2',
        direction: 'src' as ReusedAuthRequest['direction'],
        ip_addr: '3.0.0.0',
        uri: 'http://example.com/url-1',
        port: '8080',
        occurred_at: '2023-01-01T00:00:00.000Z',
        latitude: '41.1682',
        longitude: '-73.2689',
        error: 20,
        country_code: 'US',
        max_auth: '',
        max_dist: 0,
        max_error: 0,
      },
      {
        auth: 'auth-header-1',
        traffic_id: '2',
        direction: 'src' as ReusedAuthRequest['direction'],
        ip_addr: '1.0.0.0',
        uri: 'http://example.com/url-1',
        port: '8080',
        occurred_at: '2023-01-01T00:00:00.000Z',
        latitude: '-33.4940',
        longitude: '143.2104',
        error: 1000,
        country_code: 'AU',
        max_auth: '',
        max_dist: 0,
        max_error: 0,
      },
      {
        auth: '',
        traffic_id: '',
        direction: '' as ReusedAuthRequest['direction'],
        ip_addr: '',
        uri: '',
        port: '',
        occurred_at: '',
        latitude: '',
        longitude: '',
        error: 0,
        country_code: '',
        max_auth: 'auth-header-1',
        max_dist: 16705.07713397242,
        max_error: 1020,
      },
    ])
  const results = await runnerPure(query, requestsQuery);
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
        detectedAt: '2023-01-17T13:12:00.000Z',
        severity: 'medium',
        data: {
          count: 2,
          maxDist: 16705.07713397242,
          maxError: 1020,
          auth: 'auth-header-1',
          uri: 'http://example.com/url-2',
          requests: [
            {
              at: '2023-01-01T00:00:00.000Z',
              countryCode: 'US',
              direction: 'src',
              error: 20,
              ipAddr: '3.0.0.0',
              latitude: '41.1682',
              longitude: '-73.2689',
              port: '8080',
              trafficId: '2',
            },
            {
              at: '2023-01-01T00:00:00.000Z',
              countryCode: 'AU',
              direction: 'src',
              error: 1000,
              ipAddr: '1.0.0.0',
              latitude: '-33.4940',
              longitude: '143.2104',
              port: '8080',
              trafficId: '2',
            },
          ],
        },
      },
      {
        data: {
          auth: 'auth-header-1',
          count: 1,
          maxDist: 16705.07713397242,
          maxError: 1020,
          requests: [
            {
              at: '2023-01-01T00:00:00.000Z',
              countryCode: 'US',
              direction: 'src',
              error: 20,
              ipAddr: '3.0.0.0',
              latitude: '41.1682',
              longitude: '-73.2689',
              port: '8080',
              trafficId: '2',
            },
            {
              at: '2023-01-01T00:00:00.000Z',
              countryCode: 'AU',
              direction: 'src',
              error: 1000,
              ipAddr: '1.0.0.0',
              latitude: '-33.4940',
              longitude: '143.2104',
              port: '8080',
              trafficId: '2',
            },
          ],
          uri: 'http://example.com/url-1',
        },
        detectedAt: '2023-01-17T13:12:00.000Z',
        name: 'Broken Authentication: Reused Authorization',
        severity: 'medium',
        type: 'reused-auth',
      },
    ],
  });
});
