/**
 * @file dashboard.api.ts
 * @description 대시보드 API 클라이언트 (요약·시간대 추이·서비스 상태)
 * @module features/dashboard/api
 */
import { dashboardClient } from '@/shared/api';
import type { DomainMetricsResponse, DomainPeriod, ServiceTrendResponse } from '@/entities/dashboard';

export const dashboardApi = {
  getSummary: (days = 7) =>
    dashboardClient().get(`/dashboard/summary`, { params: { days } }).then((r) => r.data),

  getHourlyTrend: () =>
    dashboardClient().get(`/dashboard/hourly-trend`).then((r) => r.data),

  getDomainMetrics: (period: DomainPeriod = '10m') =>
    dashboardClient()
      .get<DomainMetricsResponse>('/dashboard/domain-metrics', { params: { period } })
      .then((r) => r.data),

  getServiceTrend: (domainId: string, svc: string, op: string, period: DomainPeriod = '10m') =>
    dashboardClient()
      .get<ServiceTrendResponse>('/dashboard/domain-metrics/service-trend', {
        params: { domainId, svc, op, period },
      })
      .then((r) => r.data),
};
