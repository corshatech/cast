/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';

export const ButtonSection = () => {
  return (
    <>
      <div className="my-8 mt-24">
        <Typography variant="h2" component="h2">
          Buttons
        </Typography>
      </div>
      <hr className="my-12" />
      <div className="mb-16">
        <div className="mb-3">
          <Typography variant="h3" component="h3">
            Primary Buttons
          </Typography>
        </div>
        <div className="flex space-x-12 justify-start items-center mb-8">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" size="lg" disabled>
            Large Disabled
          </Button>
        </div>
      </div>
      <div className="mb-16">
        <div className="mb-3">
          <Typography variant="h3" component="h3">
            Secondary Buttons
          </Typography>
        </div>
        <div className="flex space-x-12 justify-start items-center mb-8">
          <Button variant="secondary" size="sm">
            Small
          </Button>
          <Button variant="secondary" size="md">
            Medium
          </Button>
          <Button variant="secondary" size="lg">
            Large
          </Button>
          <Button variant="secondary" size="lg" disabled>
            Large Disabled
          </Button>
        </div>
      </div>
      <div className="h-64" />
    </>
  );
};
