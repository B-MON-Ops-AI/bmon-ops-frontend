/**
 * @file queryClient.ts
 * @description React Query 클라이언트 인스턴스 설정
 * @module shared/lib
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000, // 캐시 유효 시간: 10초
    },
  },
});
