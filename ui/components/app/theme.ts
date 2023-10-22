import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0a2e3b',
    },
    secondary: {
      main: '#77c043',
      dark: '#99b67c',
    },
    background: {
      paper: '#F9F9F9',
    },
    text: {
      primary: 'rgb(0,41,51)',
      disabled: 'rgba(0,41,51,0.6)',
      secondary: 'rgba(0,41,51,0.38)',
    },
  },
});
