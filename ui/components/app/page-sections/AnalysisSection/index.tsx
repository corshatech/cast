import { Typography } from '@/components/atoms'
import { Summary } from '@/components/index';
import Box from '@mui/material/Box';

export const AnalysisSection = () => {
  const boxSx = { p: 2 };
  return (
    <>
      <div className="mb-8 mt-24">
        <Typography variant="h2" component="h2">
          Analysis
        </Typography>
        <Box sx={boxSx}>
          <Summary
            faults={0}
            scansPassed={17}
            findings={0}
            severityCounts={{ none: 0, low: 0, medium: 0, high: 0, critical: 0 }}
          />
        </Box>
        <Box sx={boxSx}>
          <Summary
            faults={7}
            scansPassed={10}
            findings={143}
            severityCounts={{ none: 0, low: 2, medium: 2, high: 0, critical: 3 }}
          />
        </Box>
        <Box sx={boxSx}>
          <Summary
            faults={7}
            scansPassed={10}
            findings={143}
            severityCounts={{ none: 1, low: 2, medium: 3, high: 4, critical: 5 }}
          />
        </Box>
      </div>
    </>
  )
}
