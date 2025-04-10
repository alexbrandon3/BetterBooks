import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A2A6C', // Navy Blue
      light: '#2A3A7C',
      dark: '#0A1A5C',
    },
    secondary: {
      main: '#B87333', // Bronze/Copper
      light: '#C88343',
      dark: '#A86323',
    },
    background: {
      default: '#F6F6F6', // Cloud White
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2F4F4F', // Slate Gray
      secondary: '#708090', // Lighter Slate Gray
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1A2A6C',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      color: '#2F4F4F',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme; 