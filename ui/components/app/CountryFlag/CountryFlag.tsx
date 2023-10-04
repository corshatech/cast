import Flags from 'country-flag-icons/react/3x2';

type Props = {
    isoCode: string;
    size?: number;
}

export const CountryFlag: React.FC<Props> = ({isoCode, size = 30}) => {
    const Flag = Flags[isoCode as keyof typeof Flags];
    return <Flag style={{height: `${size}px`, width: `${size}px`}}/>
}
