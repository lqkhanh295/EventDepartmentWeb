// Theme Configuration - Minimalist Dark Theme
import { createTheme } from '@mui/material/styles';

export const colors = {
  primary: {
    main: '#FFD700',
    light: '#FFE44D',
    dark: '#CCB000',
    contrastText: '#121212'
  },
  secondary: {
    main: '#121212',
    light: '#1a1a1a',
    dark: '#000000',
    contrastText: '#fff'
  },
  background: {
    default: '#0a0a0a',
    paper: '#121212',
    elevated: '#1a1a1a'
  },
  text: {
    primary: '#ffffff',
    secondary: '#999999',
    disabled: '#444444'
  },
  border: {
    main: '#2a2a2a',
    light: '#333333'
  },
  accent: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  }
};

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    success: { main: colors.accent.success },
    warning: { main: colors.accent.warning },
    error: { main: colors.accent.error },
    info: { main: colors.accent.info }
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.02em'
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em'
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.25rem'
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.1rem'
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem'
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.9rem'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 2
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 2,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: 'none'
          }
        },
        containedPrimary: {
          background: colors.primary.main,
          color: colors.primary.contrastText,
          '&:hover': {
            background: colors.primary.light
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease',
          '&:hover': {
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#FFD700'
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease',
          '&:hover': {
            background: 'rgba(255, 215, 0, 0.05)',
            '& .MuiListItemIcon-root': {
              color: '#FFD700'
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: colors.background.paper,
          borderRadius: 2,
          border: `1px solid ${colors.border.main}`,
          boxShadow: 'none',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: colors.primary.main,
            boxShadow: 'none'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: colors.border.main
            },
            '&:hover fieldset': {
              borderColor: colors.border.light
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              borderWidth: 1
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 500,
          fontSize: '0.8rem'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: colors.background.default,
          borderRight: `1px solid ${colors.border.main}`
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: colors.background.default,
          borderBottom: `1px solid ${colors.border.main}`,
          boxShadow: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
});

export const antTheme = {
  token: {
    colorPrimary: colors.primary.main,
    colorBgBase: colors.background.default,
    colorBgContainer: colors.background.paper,
    colorBgElevated: colors.background.elevated,
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorBorder: colors.border.main,
    colorBorderSecondary: colors.border.main,
    borderRadius: 2,
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    colorSuccess: colors.accent.success,
    colorWarning: colors.accent.warning,
    colorError: colors.accent.error,
    colorInfo: colors.accent.info
  },
  components: {
    Card: {
      colorBgContainer: colors.background.paper,
      colorBorderSecondary: colors.border.main
    },
    Input: {
      colorBgContainer: colors.background.elevated,
      colorBorder: colors.border.main,
      activeBorderColor: colors.primary.main,
      hoverBorderColor: colors.border.light
    },
    Select: {
      colorBgContainer: colors.background.elevated,
      colorBgElevated: colors.background.paper,
      optionSelectedBg: 'rgba(255, 215, 0, 0.1)'
    },
    Table: {
      colorBgContainer: colors.background.paper,
      headerBg: colors.background.elevated,
      rowHoverBg: 'rgba(255, 255, 255, 0.02)'
    },
    Modal: {
      contentBg: colors.background.paper,
      headerBg: colors.background.paper
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: colors.background.elevated,
      itemHoverBg: 'rgba(255, 255, 255, 0.02)'
    }
  }
};

export default muiTheme;
