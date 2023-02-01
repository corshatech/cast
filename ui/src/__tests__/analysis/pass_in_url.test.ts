import { runnerPure } from "../../lib/analysis/pass_in_url";

test("runner works", async () => {
  const query = () =>
    Promise.resolve([
      {
        src_ip: "192.2.0.1",
        src_port: "57944",
        dst_ip: "10.1.0.96",
        dst_port: "8181",
        uri: "http://example.com/url-1",
        timestamp: new Date("2023-01-18T13:12:01.000Z"),
        query_params: ["password", "pass"]
      },
      {
        src_ip: "192.2.0.2",
        src_port: "57944",
        dst_ip: "10.1.0.96",
        dst_port: "8181",
        uri: "http://example.com/url-2",
        timestamp: new Date("2023-01-18T13:12:02.000Z"),
        query_params: ["passwd"]
      },
    ]);

  const results = await runnerPure(query);
  expect(results).toStrictEqual({
    id: "pass-in-url",
    title: "Password in Query String",
    description:
      "A password or credential was detected in a URL as a query " +
      "parameter. Using secure transport like HTTPS does not resolve the " +
      "issue, because the URL may become logged or leak to third parties " +
      "through e.g.the Referrer header.Do not include credentials in any " +
      "part of a URL.",
    reportedAt: "2023-01-17T13:12:00.000Z",
    severity: "high",
    findings: [
      {
        type: "pass-in-url",
        name: "Password in Query String",
        occurredAt: { at: "2023-01-18T13:12:01.000Z" },
        detectedAt: "2023-01-17T13:12:00.000Z",
        severity: "high",
        data: {
          queryParams: ["password", "pass"],
          inRequest: {
            srcIp: "192.2.0.1",
            srcPort: "57944",
            proto: "tcp",
            destIp: "10.1.0.96",
            destPort: "8181",
            URI: "http://example.com/url-1",
            at: "2023-01-18T13:12:01.000Z"
          }
        },
      },
      {
        type: "pass-in-url",
        name: "Password in Query String",
        occurredAt: { at: "2023-01-18T13:12:02.000Z" },
        detectedAt: "2023-01-17T13:12:00.000Z",
        severity: "high",
        data: {
          queryParams: ["passwd"],
          inRequest: {
            srcIp: "192.2.0.2",
            srcPort: "57944",
            proto: "tcp",
            destIp: "10.1.0.96",
            destPort: "8181",
            URI: "http://example.com/url-2",
            at: "2023-01-18T13:12:02.000Z"
          }
        },
      },
    ],
  });
});
