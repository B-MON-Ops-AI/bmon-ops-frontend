/**
 * @file types.ts
 * @description 대시보드 관련 타입 정의
 * @module entities/dashboard
 */
import type { MetricType } from '@/entities/incident';

export interface Widget {
  id: string;
  serviceId: string;
  serviceName: string;
  metricType: MetricType;
  order: number;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface MetricData {
  serviceId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  trend: number;
  chartData: ChartDataPoint[];
  updatedAt: string;
}

export interface WidgetListResponse {
  widgets: Widget[];
}

export interface WidgetOrderItem {
  id: string;
  order: number;
}
