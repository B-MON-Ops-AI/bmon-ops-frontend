/**
 * @file dashboard.api.ts
 * @description 대시보드 API 클라이언트 (위젯 CRUD, 메트릭 조회)
 * @module features/dashboard/api
 */
import { dashboardClient } from '@/shared/api';
import type { WidgetListResponse, MetricData, Widget, WidgetOrderItem } from '@/entities/dashboard';

export const dashboardApi = {
  getSummary: (days = 7) =>
    dashboardClient().get(`/dashboard/summary`, { params: { days } }).then((r) => r.data),

  getWidgets: () =>
    dashboardClient().get<WidgetListResponse>('/dashboard/widgets').then((r) => r.data),

  getMetrics: (serviceId: string, metricType: string) =>
    dashboardClient()
      .get<MetricData>(`/dashboard/metrics/${serviceId}`, { params: { metricType } })
      .then((r) => r.data),

  addWidget: (serviceId: string, metricType: string) =>
    dashboardClient()
      .post<Widget>('/dashboard/widgets', { serviceId, metricType })
      .then((r) => r.data),

  updateWidgetOrder: (widgetOrders: WidgetOrderItem[]) =>
    dashboardClient()
      .put('/dashboard/widgets/order', { widgetOrders })
      .then((r) => r.data),

  deleteWidget: (widgetId: string) =>
    dashboardClient().delete(`/dashboard/widgets/${widgetId}`).then((r) => r.data),
};
