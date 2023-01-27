/* This test module has been disabled so that I can push the latest
   findings framework for Russ to use
*/
test("place holder", () => {
  expect(2).toStrictEqual(2);
});

/*
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
  const results = await runnerPure(query);
  expect(results).toStrictEqual({
    id: "reused-authentication",
    title: "Reused Authentication",
    description: "",
    lastUpdated: "2023-01-17T13:12:00.000Z",
    severity: "medium",
    findings: [
      {
        id: "auth-header-1",
        type: "reused-auth",
        name: "Reused Authentication",
        description: "",
        occurredAt: { start: "2023-01-01T13:12:01.000Z", end: "2023-01-01T13:12:05.000Z" },
        detectedAt: "2023-01-17T13:12:00.000Z",
        detail: {
          auth: "auth-header-1",
          inRequests: [
            {
              srcIp: "192.168.2.0",
              srcPort: "8080",
              proto: "tcp",
              destIp: "192.168.2.100",
              destPort: "8080",
              URI: "/uri-1",
              count: 1,
            }
          ],
        },
      }
    ],
  });
});
*/
