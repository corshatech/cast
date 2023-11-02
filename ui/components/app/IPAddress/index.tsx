import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CountryFlag, Props as CountryFlagProps } from '../CountryFlag';

type Props = Omit<CountryFlagProps, 'isoCode'> & {
  address: string;
  isoCode?: string;
  lat?: string;
  long?: string;
};

const LatLongContainer = ({
  lat,
  long,
  isoCode,
  children,
  ...props
}: Omit<Props, 'address'> & { children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger className="p-0 bg-[unset] flex items-center gap-4">
      <CountryFlag {...props} isoCode={isoCode} />
      {children}
    </TooltipTrigger>
    <TooltipContent className="text-white bg-corsha-brand-blue">
      {`${lat}° ${long}°`}
    </TooltipContent>
  </Tooltip>
);

export const IPAddress = ({
  address,
  ...props
}: Props) => {
  const inner = <p>{address}</p>
  if (props.lat && props.long && props.isoCode) {
    return (
      <LatLongContainer {...props}>
        {inner}
      </LatLongContainer>
    );
  }
  return inner;
};
