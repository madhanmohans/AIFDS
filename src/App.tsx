import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { PlaygroundProvider } from './context/PlaygroundContext';
import Playground from './components/Playground';

// Define a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6caba8',
      dark: '#153447',
      light: '#a2d5d3',
    },
    secondary: {
      main: '#6d597a',
      dark: '#4b3c54',
      light: '#8d7a99',
    },
    error: {
      main: '#e66e73',
    },
    warning: {
      main: '#e6a456',
    },
    success: {
      main: '#b7bf96',
    },
    background: {
      default: '#f0f3f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#153447',
      secondary: '#5a6e79',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 400,
    },
    subtitle2: {
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PlaygroundProvider>
        <Playground />
      </PlaygroundProvider>
    </ThemeProvider>
  );
}
