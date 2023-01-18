import { runnerPure } from "../../lib/analysis/reused-authentication";

test("runner works", async () => {
  const query = () =>
    Promise.resolve([
      {
        auth_header: "auth-header-1",
        absolute_uri: "/url-1",
        src_ip: "192.0.2.1",
        timestamp: 1672578721000,
      },
      {
        auth_header: "auth-header-1",
        absolute_uri: "/url-1",
        src_ip: "192.0.2.2",
        timestamp: 1672578723000,
      },
      {
        auth_header: "auth-header-1",
        absolute_uri: "/url-2",
        src_ip: "192.0.2.1",
        timestamp: 1672578725000,
      },
    ]);
  const now = () => "2023-01-17T13:12:00Z";
  const results = await runnerPure(now, query);
  expect(results).toStrictEqual({
    id: "reused-authentication",
    name: "Reused Authentication",
    description: "",
    priority: 1,
    lastUpdated: "2023-01-17T13:12:00Z",
    findings: [
      {
        id: "auth-header-1",
        type: "reused-authentication",
        description: "",
        occurredAt: { start: "2023-01-01T13:12:01.000Z", end: "2023-01-01T13:12:05.000Z" },
        detectedAt: "2023-01-17T13:12:00Z",
        severity: "medium",
        detail: `
| Timestamp | Absolute URI | Source IP |
| --- | --- | --- |
| 2023-01-01T13:12:01.000Z | /url-1 | 192.0.2.1 |
| 2023-01-01T13:12:03.000Z | /url-1 | 192.0.2.2 |
| 2023-01-01T13:12:05.000Z | /url-2 | 192.0.2.1 |
`,
      },
    ],
  });
});
