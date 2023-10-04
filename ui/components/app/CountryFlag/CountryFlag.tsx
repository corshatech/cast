import Flags from 'country-flag-icons/react/3x2';
import Image from 'next/image';

type Props = {
    isoCode: string;
    size?: number;
}

export const CountryFlag: React.FC<Props> = ({isoCode, size = 30}) => {
    if (!(isoCode in Flags)) {
        return (
            <div style={{width: `${size}px`, height: `${size*2/3}px`, position: 'relative'}}>
                <Image 
                    src='./pirate.svg' 
                    alt={'Unknown flag icon'} 
                    fill
                />
            </div>
        )
    }
    const Flag = Flags[isoCode as keyof typeof Flags];
    return <Flag style={{width: `${size}px`, display: 'inline'}}/>
}
