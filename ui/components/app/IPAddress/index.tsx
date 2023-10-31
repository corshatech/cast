import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CountryFlag, Props as CountryFlagProps } from '../CountryFlag';


type Props = Omit<CountryFlagProps, 'isoCode'> & {
    address: string;
    isoCode?: string;
    lat?: string;
    long?: string;
}

export const IPAddress = ({address, isoCode = '', lat, long, ...props}: Props) => (
    <>
        {lat && long && isoCode !== '' ? (
                <Tooltip>
                    <TooltipTrigger className='p-0 bg-[unset] flex items-center gap-4'>
                        <CountryFlag {...props} isoCode={isoCode}/>
                        <p>{address}</p>
                    </TooltipTrigger>
                    <TooltipContent
                        className='text-white bg-corsha-brand-blue'
                    >
                        {`${lat}° ${long}°`}
                    </TooltipContent>
                </Tooltip>
            ) : (
                <p>{address}</p>
            )
        }
    </>
)
