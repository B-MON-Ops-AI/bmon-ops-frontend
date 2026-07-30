/**
 * @file useDashboard.ts
 * @description 대시보드 데이터 커스텀 훅 (요약·시간대 추이·서비스 상태)
 * @module features/dashboard/model
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import type { DomainPeriod } from '@/entities/dashboard';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 60_000);

// 도메인 지표 연동 주기 — 부하 방지를 위해 1분 실시간 미채택.
// 10분(bymi 분단위) / 1일(byhr 시간단위) 주기에 맞춰 폴링.
export const DOMAIN_POLL_MS: Record<DomainPeriod, number> = {
  '10m': 10 * 60_000,
  '1d': 24 * 60 * 60_000,
};

export function useSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard-summary', days],
    queryFn: () => dashboardApi.getSummary(days),
    refetchInterval: POLLING,
  });
}

export function useHourlyTrend() {
  return useQuery({
    queryKey: ['dashboard-hourly-trend'],
    queryFn: () => dashboardApi.getHourlyTrend(),
    refetchInterval: POLLING,
  });
}

export function useDomainMetrics(period: DomainPeriod = '10m') {
  return useQuery({
    queryKey: ['domain-metrics', period],
    queryFn: () => dashboardApi.getDomainMetrics(period),
    refetchInterval: DOMAIN_POLL_MS[period],
  });
}
