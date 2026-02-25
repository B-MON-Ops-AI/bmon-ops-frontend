/**
 * @file types.ts
 * @description 인시던트 관련 타입 정의
 * @module entities/incident
 */
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved' | 'muted';
export type Severity = 'critical' | 'warning' | 'info';
export type MetricType = 'error_rate' | 'response_time' | 'traffic' | 'request_count';

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  metricType: MetricType;
  metricValue: number;
  baseline: number;
  changePercent: number;
  severity: Severity;
  status: IncidentStatus;
  occurredAt: string;
  ackedAt?: string;
  ackedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  mutedUntil?: string;
  mutedBy?: string;
}

export interface IncidentListResponse {
  incidents: Incident[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface AISimilarCase {
  date: string;
  description: string;
  resolution: string;
}

export interface AICause {
  cause: string;
  confidence: number;
}

export interface AIAnalysisResult {
  whatChanged: string[];
  whyHappened: AICause[];
  similarCases: AISimilarCase[];
  recommendedActions: string[];
}

export interface AIAnalysis {
  incidentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  result?: AIAnalysisResult;
}

export interface CriticalCheckResponse {
  hasCritical: boolean;
  criticalCount: number;
  latestOccurredAt?: string;
}
