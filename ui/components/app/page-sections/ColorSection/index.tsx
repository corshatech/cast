import { Typography } from '@/components/index';

export const ColorSection = () => {
  return (
    <>
      <div className="my-8 mt-24">
        <Typography variant="h2" component="h2">
          Color Palette
        </Typography>
      </div>
      <hr className="my-12" />
      <div className="mb-16">
        <div className="mb-3">
          <Typography variant="h3" component="h3">
            Primary Colors
          </Typography>
        </div>
        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-brand-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Brand Blue
            </Typography>
            <Typography variant="body1" component="p">
              #0A2E3B
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-brand-mid-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Brand Mid Blue
            </Typography>
            <Typography variant="body1" component="p">
              #104457
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-brand-green rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Brand Green
            </Typography>
            <Typography variant="body1" component="p">
              #77C043
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-dark-green rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Dark Green
            </Typography>
            <Typography variant="body1" component="p">
              #57A61F
            </Typography>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-main-grey rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Main Grey
            </Typography>
            <Typography variant="body1" component="p">
              #646F79
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-field-outline-grey rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Field Outline Grey
            </Typography>
            <Typography variant="body1" component="p">
              #CBD5E1
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-link-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Link Blue
            </Typography>
            <Typography variant="body1" component="p">
              #167FA6
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-highlight-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Highlight Blue
            </Typography>
            <Typography variant="body1" component="p">
              #D5EBF3
            </Typography>
          </div>
        </div>
      </div>

      <div className="my-16">
        <div className="mb-3">
          <Typography variant="h3" component="h3">
            Graphs / Charts
          </Typography>
        </div>
        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-dark-green rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Dark Green
            </Typography>
            <Typography variant="body1" component="p">
              #276825
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-red rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Red
            </Typography>
            <Typography variant="body1" component="p">
              #C10B00
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-orange rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Orange
            </Typography>
            <Typography variant="body1" component="p">
              #FA9537
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-yellow rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Yellow
            </Typography>
            <Typography variant="body1" component="p">
              #FED766
            </Typography>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-purple rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Purple
            </Typography>
            <Typography variant="body1" component="p">
              #8850D0
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-dark-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Dark Blue
            </Typography>
            <Typography variant="body1" component="p">
              #2C2DBE
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-medium-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Medium Blue
            </Typography>
            <Typography variant="body1" component="p">
              #1378FF
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-light-blue rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Light Blue
            </Typography>
            <Typography variant="body1" component="p">
              #37ADEB
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-grey rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Grey
            </Typography>
            <Typography variant="body1" component="p">
              #979797
            </Typography>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-blue-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Blue - Light
            </Typography>
            <Typography variant="body1" component="p">
              #10445799
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-corsha-green-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Corsha Green - Light
            </Typography>
            <Typography variant="body1" component="p">
              #77C04399
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-dark-green-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Dark Green - Light
            </Typography>
            <Typography variant="body1" component="p">
              #27682599
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-red-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Red - Light
            </Typography>
            <Typography variant="body1" component="p">
              #C10B0099
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-orange-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Orange - Light
            </Typography>
            <Typography variant="body1" component="p">
              #FA953799
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-yellow-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Yellow - Light
            </Typography>
            <Typography variant="body1" component="p">
              #FED76699
            </Typography>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 align-top justify-items-start">
          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-purple-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Purple - Light
            </Typography>
            <Typography variant="body1" component="p">
              #8850D099
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-dark-blue-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Dark Blue - Light
            </Typography>
            <Typography variant="body1" component="p">
              #2C2DBE99
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-medium-blue-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Medium Blue - Light
            </Typography>
            <Typography variant="body1" component="p">
              #1378FF99
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-light-blue-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Light Blue - Light
            </Typography>
            <Typography variant="body1" component="p">
              #37ADEB99
            </Typography>
          </div>

          <div className="flex flex-col w-40 space-y-1">
            <div className="h-40 bg-grey-light rounded-lg my-3" />
            <Typography variant="h4" component="h4">
              Grey - Light
            </Typography>
            <Typography variant="body1" component="p">
              #97979799
            </Typography>
          </div>
        </div>
      </div>
      <div className="h-64" />
    </>
  );
};
