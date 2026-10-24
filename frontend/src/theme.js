import { createTheme } from '@mui/material/styles';

// Palette validée sur les maquettes (vert forêt / brun bois / fond crème).
const theme = createTheme({
  palette: {
    primary: {
      main: '#335C42',
      dark: '#233E2D',
      light: '#DCEBDD',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8A5A34',
      light: '#F1E3D1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAF8F3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#242420',
      secondary: '#8A8976',
    },
    success: {
      main: '#1F3C29',
      light: '#DCEBDD',
    },
    warning: {
      main: '#7A4E00',
      light: '#FBEBD2',
    },
    error: {
      main: '#8C2B23',
      light: '#F6DCDA',
    },
    divider: '#E8E4D8',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
