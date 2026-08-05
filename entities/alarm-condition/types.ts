export type AlarmLevel = 'Fatal' | 'Critical' | 'Major' | 'Minor';
export type DetectType = 'ERR_S' | 'ERR_E' | 'ERR_RATE' | 'RPY_TIME' | 'CALL_CASCNT';
export type DetectTerm = 'MIN1' | 'MIN5' | 'MIN10' | 'MIN30' | 'HOUR1' | 'DAY1';
export type TriggerStatus = 'no-trigger' | 'normal' | 'frequent' | 'excessive';
export type ComprType = 'COMPR_MRTH' | 'COMPR_BLW';
export type DetectHoliday = 'H' | 'S' | '';

export interface AlarmCondition {
  alarmId: string;
  alarmName: string;
  serviceId: string;
  serviceName: string;
  alarmLevel: AlarmLevel;
  detectType: DetectType;
  detectTerm: DetectTerm;
  threshold: number;
  useYn: 'Y' | 'N';
  triggerCount30d: number;
  unresolvedCount: number;
  latestTriggerAt: string | null;
  triggerStatus: TriggerStatus;

  alarmDesc: string | null;
  svcNm: string | null;
  opNm: string | null;
  chId: string | null;
  detectDow: string;
  detectHoliday: DetectHoliday;
  detectStTime: string;
  detectFnsTime: string;
  comprType: ComprType;
  pauseStartDt: string | null;
  pauseEndDt: string | null;
  regDt: string | null;
  chgDt: string | null;
}

export interface AlarmConditionListResponse {
  conditions: AlarmCondition[];
  totalCount: number;
}

// 알람조건 수동 편집 요청 (임계값·검출주기·사용여부 + 처리자)
export interface UpdateAlarmConditionRequest {
  thrs: number;
  detectTerm: DetectTerm;
  useYn: 'Y' | 'N';
  chgrId: string;
}

// ── AI 알람 공백 제안 (byhr 통계 기반) ──────────────────────
export interface AlarmGapProposal {
  svcNm: string;
  opNm: string;
  domnId: string;
  metric: string;            // '오류율' | '응답시간' | '최대응답' | '시스템오류' | '비즈니스 오류' | '호출량'
  detectType: DetectType;
  comprType: ComprType;      // COMPR_MRTH(이상) | COMPR_BLW(이하)
  type: string;              // '상대' | '절대'
  peak: number;
  unit: string;              // '%' | 'ms' | '건'
  baseline: number | null;   // 평소값 (상대 판정 시)
  proposedThreshold: number;
  alarmLevel: AlarmLevel;
  breachHits: number;
  reasons: string[];
  // 등록 필드 프리필 (활동창은 baseline에서 유도)
  detectTerm: DetectTerm;
  detectDow: string;
  detectStTime: string;      // HHmm
  detectFnsTime: string;     // HHmm
}

export interface AlarmGapResponse {
  asOf: string | null;
  baselineDays: number;
  proposals: AlarmGapProposal[];
  totalCount: number;
}

// LLM 인사이트 — 제안 1건 요약·임계 사유·리스크 (LLM 실패 시 규칙 문구, source로 구분)
export interface AlarmProposalInsight {
  summary: string;
  thresholdRationale: string;
  risk: string;
  source: 'ai' | 'rule';
}

// 제안 목록 교차 해석 — 공통 원인/우선순위
export interface AlarmProposalsOverviewGroup {
  title: string;
  note: string;
  svcNms: string[];
}
export interface AlarmProposalsOverview {
  insight: string;
  groups: AlarmProposalsOverviewGroup[];
  source: 'ai' | 'rule';
}

// 제안 근거 데이터 — 기준일 시간대별 실측 + 같은요일 baseline
export interface AlarmGapEvidenceHour {
  time: string;              // HHmm
  hour: number;              // 0~23
  n: number;                 // 호출수(정상+오류 전체)
  errS: number;              // 시스템오류 건수
  errE: number;              // 비즈니스 오류 건수
  errRate: number;           // 오류율(%)
  maxRpy: number;            // 최대응답(ms, 그 시간 내 순간 최댓값 — 참고용)
  avgRpy: number;            // 평균응답(ms, tot_rpy/deal_i — RPY_TIME 제안 판정 기준)
  value: number;             // detectType 지표값 (제안 판정과 동일 정의)
  baseline: number | null;      // 같은요일 28일 그 시간대 평소값(평균)
  baselineMin: number | null;   // 같은요일 그 시간대 최소
  baselineMax: number | null;   // 같은요일 그 시간대 최대
}

// 피크 시각의 '다른 날 같은 요일' 이력 1건
export interface AlarmGapEvidenceHistory {
  date: string | null;       // YYYY-MM-DD
  value: number;             // 그 날 그 시각 metric 값
  n: number;                 // 그 날 그 시각 호출수
  isRef: boolean;            // 기준일 여부
}

export interface AlarmGapEvidence {
  svcNm: string;
  opNm: string;
  domnId: string;
  detectType: DetectType;
  unit: string;              // '%' | 'ms' | '건'
  refDate: string | null;    // 기준일 YYYY-MM-DD
  refDow: string | null;     // 기준일 요일(stat_dow)
  baselineDays: number;
  peakTime: string | null;   // 피크 시각 HHmm (이력 대상)
  history: AlarmGapEvidenceHistory[];
  hourly: AlarmGapEvidenceHour[];
}

// 알람조건 신규 등록 요청 (공백 제안 승인)
export interface CreateAlarmConditionRequest {
  svcNm: string;
  opNm?: string;
  detectType: DetectType;
  thrs: number;
  alarmLevel: AlarmLevel;
  dlgtUnitSvcCd?: string;
  alarmNm?: string;
  detectTerm?: DetectTerm;
  comprType?: ComprType;
  detectDow?: string;
  detectStTime?: string;
  detectFnsTime?: string;
  alarmDesc?: string;
  useYn?: 'Y' | 'N';
  detectHoliday?: DetectHoliday;
  regrId?: string;
}
