'use client';

/**
 * @file ThemeProvider.tsx
 * @description MUI 테마 컨텍스트 프로바이더
 * @module shared/theme
 */

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/shared/theme/theme';

interface Props {
  children: React.ReactNode;
}

export default function AppThemeProvider({ children }: Props) {
  return (
    <AppRouterCacheProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
