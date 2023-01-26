import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { setupServer } from "msw/node";
import { rest } from "msw";

import type { AnalysisResponse } from "@/pages/api/reused-authentication";

import { FeatureComponent } from "./FeatureComponent";

const server = setupServer(
  rest.get<AnalysisResponse>("/api/reused-authentication", (req, res, ctx) => {
    return res(
      ctx.delay(500),
      ctx.status(200),
      ctx.json([`Some thing with text response`])
    );
  })
);

global.fetch = jest.fn();

describe("Feature Component", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  it.skip("should show Loading when fetching data", () => {
    render(<FeatureComponent />);
    const loadingText = screen.getByText("Loading...");

    expect(loadingText).toBeInTheDocument();
  });

  it("should show error when fetch fails", () => {
    render(<FeatureComponent />);
    const error = screen.getByText("Error");

    expect(error).toBeInTheDocument();
  });

  it.skip("should show data when fetch succeeds", async () => {
    render(<FeatureComponent />);

    await waitForElementToBeRemoved(() => screen.getByText("Loading..."));
    expect(await screen.findByText("A Title")).toBeTruthy();
  });
});
