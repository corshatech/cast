import { runnerPure } from "../../lib/analysis/urlpassword";

test("runner works", async () => {
  const query = () =>
    Promise.resolve([
      {
        id: "id-1",
        absolute_uri: "/url-1",
        src_ip: "192.0.2.1",
        timestamp: 1672578721000,
        password_fields: ["password", "pass"]
      },
      {
        id: "id-2",
        absolute_uri: "/url-2",
        src_ip: "192.0.2.2",
        timestamp: 1672578723000,
        password_fields: ["passwd"]
      },
    ]);

  const now = () => "2023-01-17T13:12:00Z";
  const results = await runnerPure(now, query);
  expect(results).toStrictEqual({
    id: "urlpassword",
    name: "Password in Query String",
    description: "Potential password in query string",
    priority: 1,
    lastUpdated: "2023-01-17T13:12:00Z",
    findings: [
      {
        id: "id-1",
        type: "urlpassword",
        name: "Password in Query String",
        description: "Potential password in query string for /url-1",
        occurredAt: { at: "2023-01-01T13:12:01.000Z" },
        detectedAt: "2023-01-17T13:12:00Z",
        severity: "high",
        detail: `
- Absolute URI: /url-1
- Source IP: 192.0.2.1
- Password URL Parameter:
  - password
  - pass
`,
      },
      {
        id: "id-2",
        type: "urlpassword",
        name: "Password in Query String",
        description: "Potential password in query string for /url-2",
        occurredAt: { at: "2023-01-01T13:12:03.000Z" },
        detectedAt: "2023-01-17T13:12:00Z",
        severity: "high",
        detail: `
- Absolute URI: /url-2
- Source IP: 192.0.2.2
- Password URL Parameter:
  - passwd
`,
      },
    ],
  });
});
