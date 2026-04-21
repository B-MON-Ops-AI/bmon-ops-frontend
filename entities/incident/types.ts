/**
 * @file types.ts
 * @description 인시던트 관련 타입 정의 (BMON 알람 데이터 기반)
 * @module entities/incident
 */
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved' | 'muted';
export type Severity = 'fatal' | 'critical' | 'major' | 'minor';
export type MetricType = 'error_rate' | 'response_time' | 'traffic' | 'request_count';
export type DetectType = 'ERR_S' | 'RPY_TIME' | 'ERR_RATE' | 'ERR_E' | 'CALL_CASCNT';
export type DetectTerm = 'MIN1' | 'MIN5' | 'MIN10' | 'HOUR1' | 'DAY1';

export interface Incident {
  id: string;
  alarmId: string;
  alarmHstSeq: string;
  serviceId: string;
  serviceName: string;
  applNm?: string;
  chId?: string;
  logPoint?: string;
  svcNm?: string;
  opNm?: string;
  alarmName: string;
  alarmDesc: string;
  alarmContent: string;
  detectType: DetectType;
  detectTerm: DetectTerm;
  threshold: number;
  thresholdValue: number;
  changePercent: number;
  severity: Severity;
  status: IncidentStatus;
  clearYn: boolean;
  clearDt?: string;
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
  alarmName: string;
  serviceName: string;
  thresholdValue: number;
  clearYn: boolean;
  resolution?: string;
}

export interface AICause {
  cause: string;
  confidence: number;
}

export interface AIAlarmPattern {
  totalOccurrences: number;
  autoClearRate: number;
  avgClearMinutes: number;
  peakHour: string;
  peakDayOfWeek: string;
  recentTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface AIAnalysisResult {
  whatChanged: string[];
  whyHappened: AICause[];
  similarCases: AISimilarCase[];
  recommendedActions: string[];
  alarmPattern?: AIAlarmPattern;
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
