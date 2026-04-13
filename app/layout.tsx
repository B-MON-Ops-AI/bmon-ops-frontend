/**
 * @file layout.tsx
 * @description 루트 레이아웃 (프로바이더 구성, 인증 가드)
 * @module app
 */
import type { Metadata } from 'next';
import '@/shared/styles/globals.css';
import { AppThemeProvider } from '@/shared/theme';
import { StoreProvider } from '@/shared/store';
import { QueryProvider } from '@/shared/lib';
import { AuthGuard } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Ops AI',
  description: 'AI 기반 인프라 모니터링 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/runtime-env.js" />
      </head>
      <body>
        <StoreProvider>
          <QueryProvider>
            <AppThemeProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </AppThemeProvider>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
