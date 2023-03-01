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
            <span className="font-black">Body 1 Black</span>
            <span className="font-black">Nunito Sans Black 16px</span>
          </Typography>
          <Typography variant="body1">
            <span className="font-bold">Body 1 Bold</span>
            <span className="font-bold">Nunito Sans Bold 16px</span>
          </Typography>
          <Typography variant="body1">
            <span>Body 1 Regular</span>
            <span>Nunito Sans Regular 16px</span>
          </Typography>
          <Typography variant="body1">
            <span className="underline font-medium">Body 1 Underlined</span>
            <span className="underline font-medium">
              Nunito Sans Medium Underline 16px
            </span>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body2">
            <span className="font-bold">Body 2 Bold</span>
            <span className="font-bold">Nunito Sans Bold 14px</span>
          </Typography>
          <Typography variant="body2">
            <span>Body 2 Regular</span>
            <span>Nunito Sans Regular 14px</span>
          </Typography>
          <Typography variant="body2">
            <span className="underline font-medium">Body 2 Underlined</span>
            <span className="underline font-medium">
              Nunito Sans Medium Underline 14px
            </span>
          </Typography>
          <Typography variant="body2">
            <span className="font-medium">All Caps</span>
            <span className="font-black capitalize">
              Nunito Sans Black All Caps 14px
            </span>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body3">
            <span className="font-black">Body 3 Black</span>
            <span className="font-black">Nunito Sans Black 12px</span>
          </Typography>
          <Typography variant="body3">
            <span className="font-bold">Body 3 Bold</span>
            <span className="font-bold">Nunito Sans Bold 12px</span>
          </Typography>
          <Typography variant="body3">
            <span>Body 3 Regular</span>
            <span>Nunito Sans Regular 12px</span>
          </Typography>
          <Typography variant="body3">
            <span className="underline font-medium">Body 3 Underlined</span>
            <span className="underline font-medium">
              Nunito Sans Medium Underline 12px
            </span>
          </Typography>
        </div>
        <div className="grid grid-cols-4 justify-between items-start pt-12">
          <Typography variant="body4">
            <span className="font-black">Body 4 Black</span>
            <span className="font-black">Nunito Sans Black 10px</span>
          </Typography>
          <Typography variant="body4">
            <span className="font-bold">Body 4 Bold</span>
            <span className="font-bold">Nunito Sans Bold 10px</span>
          </Typography>
          <Typography variant="body4">
            <span>Body 4 Regular</span>
            <span>Nunito Sans Regular 10px</span>
          </Typography>
          <Typography variant="body4">
            <span className="underline font-medium">Body 4 Underlined</span>
            <span className="underline font-medium">
              Nunito Sans Medium Underline 10px
            </span>
          </Typography>
        </div>
      </div>
      <div className="h-64" />
    </>
  );
};
