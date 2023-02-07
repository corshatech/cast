import { Typography } from '@/components/index';

export const TypographySection = () => {
  return (
    <>
      <div className="mb-8 mt-24">
        <Typography variant="h2" component="h2">
          Typography
        </Typography>
      </div>
      <hr className="my-12" />
      <div className="space-y-6 mb-24 flex flex-col">
        <Typography variant="h1" component="h1">
          Heading Level One
        </Typography>
        <Typography variant="h2" component="h2">
          Heading Level Two
        </Typography>
        <Typography variant="h3" component="h3">
          Heading Level Three
        </Typography>
        <Typography variant="h4" component="h4">
          Heaving Level Four
        </Typography>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body1">
            <div className="font-black">Body 1 Black</div>
            <div className="font-black">Nunito Sans Black 16px</div>
          </Typography>
          <Typography variant="body1">
            <div className="font-bold">Body 1 Bold</div>
            <div className="font-bold">Nunito Sans Bold 16px</div>
          </Typography>
          <Typography variant="body1">
            <div>Body 1 Regular</div>
            <div>Nunito Sans Regular 16px</div>
          </Typography>
          <Typography variant="body1">
            <div className="underline font-medium">Body 1 Underlined</div>
            <div className="underline font-medium">
              Nunito Sans Medium Underline 16px
            </div>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body2">
            <div className="font-bold">Body 2 Bold</div>
            <div className="font-bold">Nunito Sans Bold 14px</div>
          </Typography>
          <Typography variant="body2">
            <div>Body 2 Regular</div>
            <div>Nunito Sans Regular 14px</div>
          </Typography>
          <Typography variant="body2">
            <div className="underline font-medium">Body 2 Underlined</div>
            <div className="underline font-medium">
              Nunito Sans Medium Underline 14px
            </div>
          </Typography>
          <Typography variant="body2">
            <div className="font-medium">All Caps</div>
            <div className="font-black capitalize">
              Nunito Sans Black All Caps 14px
            </div>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body3">
            <div className="font-black">Body 3 Black</div>
            <div className="font-black">Nunito Sans Black 12px</div>
          </Typography>
          <Typography variant="body3">
            <div className="font-bold">Body 3 Bold</div>
            <div className="font-bold">Nunito Sans Bold 12px</div>
          </Typography>
          <Typography variant="body3">
            <div>Body 3 Regular</div>
            <div>Nunito Sans Regular 12px</div>
          </Typography>
          <Typography variant="body3">
            <div className="underline font-medium">Body 3 Underlined</div>
            <div className="underline font-medium">
              Nunito Sans Medium Underline 12px
            </div>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body4">
            <div className="font-black">Body 4 Black</div>
            <div className="font-black">Nunito Sans Black 10px</div>
          </Typography>
          <Typography variant="body4">
            <div className="font-bold">Body 4 Bold</div>
            <div className="font-bold">Nunito Sans Bold 10px</div>
          </Typography>
          <Typography variant="body4">
            <div>Body 4 Regular</div>
            <div>Nunito Sans Regular 10px</div>
          </Typography>
          <Typography variant="body4">
            <div className="underline font-medium">Body 4 Underlined</div>
            <div className="underline font-medium">
              Nunito Sans Medium Underline 10px
            </div>
          </Typography>
        </div>
      </div>
      <div className="h-64" />
    </>
  );
};
