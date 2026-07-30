/**
 * @file types.ts
 * @description 대시보드 관련 타입 정의
 * @module entities/dashboard
 */
export interface ChartDataPoint {
  time: string;    // 축 라벨 (HH:MM)
  value: number;
  ts?: string;     // 전체 시각 (ISO) — hover 툴팁에서 날짜+시각 표시용
}

// ── 도메인 실측 지표 (커스텀 Wall) ─────────────────────────────
// 소스: bmonown.mo_bymi_* (ch_ingrs·ch_svc·esb). 알람과 무결합, 순수 운영지표.

export type DomainId = 'all' | 'order' | 'lt' | 'b2ccrm' | 'rds';

/** 집계·연동 주기 — 부하 방지를 위해 실시간(1분) 대신 10분/1일 주기 집계
 *  (10m → bymi 분단위 / 1d → byhr 시간단위. BE PERIOD_CONFIG와 대응) */
export type DomainPeriod = '10m' | '1d';

/** 특화 카드(하단) 분해 축 */
export type BreakdownType = 'service' | 'channel' | 'esb';

export interface DomainBreakdownItem {
  name: string;          // svc_nm
  opName: string;        // op_nm ('service' 등)
  throughput: number;    // 정상(I) = deal_i
  dealD: number;         // 정상(D) = deal_d
  errS: number;          // 오류(S) = err_s (시스템)
  errE: number;          // 오류(E) = err_e (외부)
  errorRate: number | null;   // (S+E)/n
  errorRateS: number;    // 오류율(S)
  errorRateE: number;    // 오류율(E)
  avgResponseMs: number;
  maxResponseMs: number;
  responseStdDev: number; // 표준편차
}

/** 시간대별 오버레이 1버킷 (정상호출·평균응답·오류호출 겹쳐보기 + hover용 전 지표) */
export interface DomainOverlayPoint {
  time: string;
  normal: number;    // 정상호출 (deal_i)
  avgResp: number;   // 평균응답 (ms)
  errCount: number;  // 오류호출 (err_s+err_e)
  errRate: number;   // 오류율 (%)
  maxResp: number;   // 최대응답 (ms)
  ts?: string;       // 전체 시각 (ISO) — hover 툴팁 날짜+시각
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
  maxResponseTrend: ChartDataPoint[]; // 버킷별 최대응답(ms) — 최대응답 카드 스파크라인·hover
  hourlyOverlay: DomainOverlayPoint[]; // 시간대별 정상·응답·오류 겹쳐보기 (image6 스타일)
  breakdownType: BreakdownType;
  breakdownTitle: string;
  breakdown: DomainBreakdownItem[];
  source: string;                  // 근거 원천 표기 (예: "ch_ingrs·ch_svc")
}

export interface DomainMetricsResponse {
  period: DomainPeriod;    // 집계 주기 ('10m' → bymi 분단위 / '1d' → byhr 시간단위)
  windowMinutes: number;   // 집계 시간창 (10 또는 1440). 부하 방지를 위해 1분 미채택
  asOf: string;            // 기준 시각 = 마지막으로 완결된 집계 버킷 (ISO)
  domains: DomainMetrics[];
}
