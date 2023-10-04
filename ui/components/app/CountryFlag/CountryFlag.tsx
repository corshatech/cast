import Flags from 'country-flag-icons/react/3x2';
import Image from 'next/image';

type Props = {
    isoCode: string;
    size?: number;
}

export const CountryFlag: React.FC<Props> = ({isoCode, size = 30}) => {
    if (!(isoCode in Flags)) {
        return (
            <Image 
                src='./pirate.svg' 
                alt={'Unknown flag icon'} 
                width={size} 
                height={size}
            />
        )
    }
    const Flag = Flags[isoCode as keyof typeof Flags];
    return <Flag style={{width: `${size}px`}}/>
}
