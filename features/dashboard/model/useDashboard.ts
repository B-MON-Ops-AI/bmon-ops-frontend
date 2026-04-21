/**
 * @file useDashboard.ts
 * @description 대시보드 위젯·메트릭 데이터 커스텀 훅
 * @module features/dashboard/model
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import type { WidgetOrderItem } from '@/entities/dashboard';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 30_000);

export function useSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard-summary', days],
    queryFn: () => dashboardApi.getSummary(days),
    refetchInterval: POLLING,
  });
}

export function useWidgets() {
  return useQuery({
    queryKey: ['widgets'],
    queryFn: () => dashboardApi.getWidgets(),
    refetchInterval: POLLING,
  });
}

export function useMetrics(serviceId: string, metricType: string) {
  return useQuery({
    queryKey: ['metrics', serviceId, metricType],
    queryFn: () => dashboardApi.getMetrics(serviceId, metricType),
    refetchInterval: POLLING,
    enabled: !!serviceId && !!metricType,
  });
}

export function useAddWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, metricType }: { serviceId: string; metricType: string }) =>
      dashboardApi.addWidget(serviceId, metricType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  });
}

export function useUpdateWidgetOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (widgetOrders: WidgetOrderItem[]) =>
      dashboardApi.updateWidgetOrder(widgetOrders),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  });
}

export function useDeleteWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (widgetId: string) => dashboardApi.deleteWidget(widgetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  });
}
