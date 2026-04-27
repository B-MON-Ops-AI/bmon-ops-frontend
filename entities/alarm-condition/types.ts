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
