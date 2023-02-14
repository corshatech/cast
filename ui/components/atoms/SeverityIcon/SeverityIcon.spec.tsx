import { render } from '@testing-library/react';

import type { Severity } from '@/lib/findings';
import { SeverityIcon } from './';

describe('SeverityIcon', () => {
  test.each(['none', 'low', 'medium', 'high', 'critical', 'UNKNOWN_-InVALID'])(
    'matches snapshot for severity %p',
    (severity) => {
      const { asFragment } = render(<SeverityIcon severity={severity as Severity}/>)
      expect(asFragment()).toMatchSnapshot()
    })
});
