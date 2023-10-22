import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#77c043',
      dark: '#99b67c',
    },
    secondary: {
      main: '#0a2e3b',
    },
    background: {
      paper: 'rgb(22,55,69)',
    },
    text: {
      primary: '#FFF',
      disabled: 'rgba(255,255,255,0.73)',
      secondary: 'rgba(255,255,255,0.64)',
    },
    divider: '#C4EEEE',
  },
});
