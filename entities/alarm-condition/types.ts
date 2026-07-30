export type AlarmLevel = 'Critical' | 'Major' | 'Minor';
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
  metric: string;            // '오류율' | '최대응답' | '시스템오류' | '외부오류' | '호출량'
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
  regrId?: string;
}
