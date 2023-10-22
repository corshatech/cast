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

import { cx } from 'class-variance-authority';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './CAST-logo.svg';

type Props = {
  big?: boolean;
}

export const Header: React.FC<Props> = ({big}) => {
  return (
    <header className={cx(
      'h-[72px] bg-white flex w-full m-0 justify-start items-center',
      big && 'h-40',
    )}>
      <nav className="flex flex-1 max-w-full 2xl:max-4K:max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 justify-center items-center">
        <ul>
          <li>
            <Link href="/" className="text-white">
              <Image
                src={Logo}
                className={cx(
                  'h-[60px] w-fit',
                  big && 'h-20',
                )}
               alt="CAST by Corsha Logo"></Image>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};
