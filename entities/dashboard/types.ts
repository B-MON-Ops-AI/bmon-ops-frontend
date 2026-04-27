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

// ── 서비스 상태 (커스텀 Wall) ─────────────────────────────────

export type HealthStatus = 'normal' | 'caution' | 'warning' | 'danger' | 'critical';

export interface AlarmSummary {
  fatal: number;
  critical: number;
  major: number;
  minor: number;
  unresolved: number;
}

export interface RecentAlarm {
  seq: number;
  name: string;
  level: 'Fatal' | 'Critical' | 'Major' | 'Minor';
}

export interface ServiceStatus {
  serviceId: string;
  serviceName: string;
  requestPerMin: number;
  errorRate: number;
  maxResponseMs: number;
  avgResponseMs: number;
  alarms: AlarmSummary;
  health: HealthStatus;
  recentAlarms: RecentAlarm[];
  requestChart: ChartDataPoint[];
  updatedAt: string;
}

export interface ServiceStatusListResponse {
  services: ServiceStatus[];
}
