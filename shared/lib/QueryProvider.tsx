'use client';

/**
 * @file QueryProvider.tsx
 * @description React Query 컨텍스트 프로바이더
 * @module shared/lib
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
