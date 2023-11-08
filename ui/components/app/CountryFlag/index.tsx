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

import Flags from 'country-flag-icons/react/3x2';
import Image from 'next/image';

export type Props = {
    isoCode?: string;
    size?: number;
    className?: string;
}

export const CountryFlag: React.FC<Props> = ({isoCode = 'N/A', size = 30, className}) => {
    if (!(isoCode in Flags)) {
        return (
            <div
                className={className}
                style={{
                    width: `${size}px`,
                    height: `${size*2/3}px`,
                    position: 'relative',
                    display: 'inline',
                }}
            >
                <Image
                    src='./pirate.svg'
                    alt={'Unknown flag icon'}
                    fill
                />
            </div>
        )
    }
    const Flag = Flags[isoCode as keyof typeof Flags];
    return (
        <Flag
            className={className}
            style={{
                width: `${size}px`,
                height: `${size*2/3}px`,
                display: 'inline',
            }}
        />
    )
}
