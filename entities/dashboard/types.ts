/**
 * @file types.ts
 * @description 대시보드 관련 타입 정의
 * @module entities/dashboard
 */
export interface ChartDataPoint {
  time: string;
  value: number;
}

// ── 도메인 실측 지표 (커스텀 Wall) ─────────────────────────────
// 소스: bmonown.mo_bymi_* (ch_ingrs·ch_svc·esb). 알람과 무결합, 순수 운영지표.

export type DomainId = 'all' | 'order' | 'lt' | 'b2ccrm' | 'rds';

/** 집계·연동 주기 — 부하 방지를 위해 실시간(1분) 대신 30분/1일 주기 집계 */
export type DomainPeriod = '30m' | '1d';

/** 특화 카드(하단) 분해 축 */
export type BreakdownType = 'service' | 'channel' | 'esb';

export interface DomainBreakdownItem {
  name: string;          // svc_nm
  opName: string;        // op_nm ('service' 등)
  throughput: number;    // 처리량(건)
  errorRate: number | null;
  avgResponseMs: number;
  maxResponseMs: number;
}

export type DomainAlarmStatus = 'open' | 'resolved' | 'cleared';

/** 금일 발생 알람 이력 1건 (서술적 이력 — 분석/판정은 Shadow Test·Advisor 몫) */
export interface DomainAlarmEvent {
  seq: number;               // alarm_hst_seq
  occurredAt: string;        // 발생 시각 (ISO, 금일)
  level: 'Fatal' | 'Critical' | 'Major' | 'Minor';
  serviceName: string;       // 단위서비스명
  alarmName: string;
  detectLabel: string;       // 검출유형 라벨 (예: 시스템오류)
  thresholdValue: number;    // 발생값
  threshold: number;         // 임계값
  unit: string;              // 건 | % | ms
  status: DomainAlarmStatus; // open=미해소 · resolved=수동해결 · cleared=자동해소
  // 상세(선택)
  alarmDesc?: string;        // 알람 설명
  detectTerm?: string;       // 검출 주기 라벨 (예: 5분)
  disposer?: string;         // 처리자 사번 (resolved)
  disposedAt?: string;       // 처리/해소 시각 (ISO)
}

export interface DomainMetrics {
  domainId: DomainId;
  label: string;
  alarmHistory: DomainAlarmEvent[]; // 금일 발생 알람 이력 (집계 주기와 무관, 항상 당일)
  throughput: number;              // 처리량(건) = Σ deal_i
  errorRate: number | null;        // (err_s+err_e)/n · null = 실측 무오류
  errS: number;                    // 시스템오류 건
  errE: number;                    // 외부오류 건
  avgResponseMs: number;           // Σtot_rpy / n
  maxResponseMs: number;           // max(max_rpy_time)
  responseStdDev: number;          // √(tot_sqr/n − avg²)
  throughputTrend: ChartDataPoint[];
  errorRateTrend: ChartDataPoint[];
  responseTrend: ChartDataPoint[];
  breakdownType: BreakdownType;
  breakdownTitle: string;
  breakdown: DomainBreakdownItem[];
  source: string;                  // 근거 원천 표기 (예: "ch_ingrs·ch_svc")
}

export interface DomainMetricsResponse {
  period: DomainPeriod;    // 집계 주기 ('30m' → byhr 롤업 / '1d' → bydy)
  windowMinutes: number;   // 집계 시간창 (30 또는 1440). 부하 방지를 위해 1분 미채택
  asOf: string;            // 기준 시각 = 마지막으로 완결된 집계 버킷 (ISO)
  domains: DomainMetrics[];
}
