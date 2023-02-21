import React from 'react';
import {
  Card,
  CardContent,
  useTheme,
  Collapse,
  CardActions,
  styled,
  IconButton,
} from '@mui/material';
import Link from 'next/link';

import type { Analysis as AnalysisType } from '@/lib/findings';
import { SeverityIcon, Checkmark, Typography } from '@/components/atoms';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { IconButtonProps } from '@mui/material/IconButton';

export type AnalysisProps = {
  children?: React.ReactNode;
  noResults?: boolean;
} & Pick<
  AnalysisType,
  'description'
  | 'reportedAt'
  | 'weaknessLink'
  | 'weaknessTitle'
  | 'severity'
  | 'title'
>;

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const Weakness: React.FC<{
  weaknessLink?: string
  weaknessTitle?: string
}> = ({ weaknessLink, weaknessTitle }) => (
  weaknessLink
  ? (
    <tr>
      <td>Learn&nbsp;more:</td>
      <td>
        <Link className='underline' href={weaknessLink}>{weaknessTitle ?? weaknessLink}</Link>
      </td>
    </tr>
  )
  : null
);

const NoResults: React.FC<AnalysisProps> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  title,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return <Card className='max-w-prose -my-3'>
    <CardContent className='flex items-center'>
      <Typography
        variant='h2'
        className='font-light grow align-text-bottom'
        style={{color: theme.palette.success.main}}
      >
        <Checkmark/>{' '}
        {title}
        {' - OK'}
      </Typography>
      <ExpandMore
        expand={expanded}
        onClick={handleExpandClick}
        aria-expanded={expanded}
        aria-label="show description"
      >
        <GridExpandMoreIcon/>
      </ExpandMore>
    </CardContent>
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <CardContent sx={{paddingTop: 0}}>
        <Typography className='max-w-prose mb-4 text-zinc-400' variant='body1'>{description}</Typography>
        <table className='font-light text-zinc-400 border-separate border-spacing-x-4'>
          <tbody>
            <tr>
              <td>Updated:</td>
              <td><FormattedDate when={reportedAt}/></td>
            </tr>
            <Weakness weaknessLink={weaknessLink} weaknessTitle={weaknessTitle}/>
          </tbody>
        </table>
      </CardContent>
    </Collapse>
  </Card>
}

export const AnalysisCard: React.FC<AnalysisProps> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  severity,
  title,
  noResults,
  children,
}) => (
  noResults
    ? <NoResults {...{
      description,
      reportedAt,
      weaknessLink,
      weaknessTitle,
      severity,
      title,
      noResults,
    }}/>
    : <Card>
    <CardContent>
      <Typography variant='h2'><SeverityIcon severity={severity}/> {title}</Typography>
      <Typography className='max-w-prose my-2' variant='body1'>{description}</Typography>
      <table className='font-light my-2 text-zinc-400 border-separate border-spacing-x-4'>
        <tbody>
          <tr>
            <td>Updated:</td><td><FormattedDate when={reportedAt}/></td>
          </tr>
          <tr>
            <td>Issue Severity:</td><td>{severity}</td>
          </tr>
          <Weakness weaknessLink={weaknessLink} weaknessTitle={weaknessTitle}/>
        </tbody>
      </table>
      {children}
    </CardContent>
  </Card>
)
