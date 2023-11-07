import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CountryFlag } from '../CountryFlag';

type Props = {
  className?: string;
  isoCode?: string;
  lat?: string;
  long?: string;
  size: number | undefined;
};

const LatLongContainer = ({
  lat,
  long,
  isoCode,
  children,
  ...props
}: Props & { children?: React.ReactNode }) => (
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
}: Props & {address: string}) => {
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
