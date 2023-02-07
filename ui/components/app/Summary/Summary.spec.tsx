import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import { Summary } from './index';
import { AnalysesResponse } from '@/pages/api/analyses';

const server = setupServer(
  rest.get<AnalysesResponse>('/api/reused-authentication', (req, res, ctx) => {
    return res(
      ctx.delay(500),
      ctx.status(200),
      ctx.json([`Some thing with text response`]),
    );
  }),
);

global.fetch = jest.fn();

describe('Summary Component', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  it.skip('should show Loading when fetching data', () => {
    render(<Summary />);
    const loadingText = screen.getByText('Loading...');

    expect(loadingText).toBeInTheDocument();
  });

  it.skip('should show error when fetch fails', () => {
    render(<Summary />);
    const error = screen.getByText('Error');

    expect(error).toBeInTheDocument();
  });

  it.skip('should show data when fetch succeeds', async () => {
    render(<Summary />);

    await waitForElementToBeRemoved(() => screen.getByText('Loading...'));
    expect(await screen.findByText('Summary')).toBeTruthy();
  });
});
