'use client';

/**
 * @file theme.ts
 * @description MUI 다크 테마 설정 (컬러, 타이포그래피, 컴포넌트 오버라이드)
 * @module shared/theme
 */

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
    background: {
      default: '#111827',
      paper: '#1F2937',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E7EB',
      disabled: '#6B7280',
    },
    divider: '#374151',
  },
  typography: {
    fontFamily: "'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontSize: '3rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 },
    h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: 48,
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '1rem',
        },
        sizeSmall: {
          height: 36,
          fontSize: '0.875rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            height: 48,
            backgroundColor: '#1F2937',
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#374151',
            },
            '&:hover fieldset': {
              borderColor: '#3B82F6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F2937',
          border: '1px solid #374151',
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F2937',
          borderBottom: '1px solid #374151',
          boxShadow: 'none',
          height: 64,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1F2937',
          borderLeft: '1px solid #374151',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1F2937',
          borderRadius: 12,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
        },
      },
    },
    // 드롭다운(Select) 팝오버 — 닫힌 입력창은 각 화면 스타일, 열린 메뉴는 여기서 앱 전역 통일
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          // 입력창과 시각적으로 이어지도록 하단 정렬 + 간격
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          slotProps: {
            paper: {
              sx: {
                mt: 0.5,
                backgroundColor: '#1F2937',
                backgroundImage: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                // 메뉴 아이템 리스트 상하 패딩 축소로 조밀하게
                '& .MuiList-root': { py: 0.5 },
              },
            },
          },
        },
      },
      styleOverrides: {
        // 닫힌 상태 Select 아이콘 색 통일
        icon: {
          color: '#9CA3AF',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1F2937',
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.82rem',
          borderRadius: 6,
          marginLeft: 4,
          marginRight: 4,
          minHeight: 34,
          transition: 'background-color 0.12s ease',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
          '&.Mui-selected': {
            color: '#A5B4FC',
            backgroundColor: 'rgba(99,102,241,0.16)',
            '&:hover': {
              backgroundColor: 'rgba(99,102,241,0.24)',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: '#374151',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: '#374151',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#374151',
        },
        head: {
          backgroundColor: '#111827',
          fontWeight: 700,
          fontSize: '0.875rem',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1280,
      xl: 1536,
    },
  },
});

export default theme;
