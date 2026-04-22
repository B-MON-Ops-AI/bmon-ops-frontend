/**
 * @file data.ts
 * @description PRD 운영 데이터 기반 Mock 데이터
 *
 * 데이터 소스:
 *   - mo_alarm_hst.csv          → Incident 목록, AI 유사케이스
 *   - mo_alarm_cond.csv         → Incident 시나리오, 임계값 설정
 *   - mo_alarm_user.xlsx        → 사용자 목록, 알림 수신 설정
 *   - mo_alarm_group.csv        → 알람 수신 그룹
 *   - bmonown.mo_bymi_biz_svc_stat   → 비즈서비스 메트릭
 *   - bmonown.mo_bymi_ch_svc_stat    → 서비스별 상세 메트릭
 *   - bmonown.mo_bymi_ch_ingrs_stat  → 채널별 유입 메트릭
 */

// ── 유틸리티 ─────────────────────────────────────────────────

const T = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

/**
 * PRD 트래픽 패턴 기반 시계열 데이터 생성
 * bmonown.mo_bymi_biz_svc_stat: biz_svc_meta_id=19 기준
 * 새벽(0시): ~8,000 → 업무시간(9~18시): ~25,000 → 야간: ~12,000
 */
function makeChart(
  base: number,
  variance = 0.15,
  len = 20,
): { time: string; value: number }[] {
  const now = Date.now();
  return Array.from({ length: len }, (_, i) => {
    const jitter = 1 + (Math.random() - 0.5) * 2 * variance;
    const trend = 1 + (i - len / 2) * 0.005; // 약간의 상승 추세
    return {
      time: new Date(now - (len - i) * 60_000).toISOString(),
      value: Math.max(0, Math.round(base * jitter * trend)),
    };
  });
}

/**
 * 에러율 차트: 대부분 낮지만 간헐적 스파이크
 * ch_ingrs_stat: DOMLT/CB err_e=36/1645 = 2.2%
 */
function makeErrorRateChart(
  base: number,
  spikeAt = -1,
  len = 20,
): { time: string; value: number }[] {
  const now = Date.now();
  return Array.from({ length: len }, (_, i) => ({
    time: new Date(now - (len - i) * 60_000).toISOString(),
    value:
      i === (spikeAt >= 0 ? spikeAt : len - 3)
        ? Math.round(base * 3.5 * 100) / 100
        : Math.round((base + (Math.random() - 0.4) * base * 0.6) * 100) / 100,
  }));
}

/**
 * 응답시간 차트: 평균 안정적이나 간헐적 지연
 * ch_svc_stat: DOMLT/CB/NBSS_ORD avg 114ms, max 4478ms
 */
function makeResponseTimeChart(
  base: number,
  len = 20,
): { time: string; value: number }[] {
  const now = Date.now();
  return Array.from({ length: len }, (_, i) => ({
    time: new Date(now - (len - i) * 60_000).toISOString(),
    value: Math.round(
      base * (1 + (Math.random() - 0.45) * 0.5) +
        (i === len - 5 ? base * 2 : 0),
    ),
  }));
}

// ── Dashboard Widgets ────────────────────────────────────────
// 서비스 코드 → bmonown.mo_bymi_ch_ingrs_stat의 도메인/채널 매핑

export const MOCK_WIDGETS = {
  widgets: [
    { id: 'w1', serviceId: 'BG008802', serviceName: 'KOS-요금온라인', metricType: 'request_count' as const, order: 0 },
    { id: 'w2', serviceId: 'BG008802', serviceName: 'KOS-요금온라인', metricType: 'error_rate' as const, order: 1 },
    { id: 'w3', serviceId: 'BG011706', serviceName: 'KOS-유선공통', metricType: 'response_time' as const, order: 2 },
    { id: 'w4', serviceId: 'BG011701', serviceName: 'KOS-무선오더', metricType: 'request_count' as const, order: 3 },
    { id: 'w5', serviceId: 'BG009102', serviceName: 'KOS-B2C CRM', metricType: 'error_rate' as const, order: 4 },
    { id: 'w6', serviceId: 'BG008702', serviceName: 'KOS-통합고객', metricType: 'request_count' as const, order: 5 },
    { id: 'w7', serviceId: 'BG009201', serviceName: 'KOS-B2B CRM', metricType: 'response_time' as const, order: 6 },
    { id: 'w8', serviceId: 'BG009001', serviceName: 'KOS-물류', metricType: 'traffic' as const, order: 7 },
  ],
};

// ── Dashboard Metrics ────────────────────────────────────────
// 데이터 소스별 실제 수치 범위:
//   biz_svc_stat id=19 (DOMORDER): 8,000~12,000 req/min, avg_rpy ~1,400ms
//   ch_ingrs_stat DOMORDER/OT: 10,841 req/min
//   ch_ingrs_stat DOMB2CCRM/OM: 19,820 req/min
//   ch_ingrs_stat DOMLT/CB: 1,645 req/min, err_e=36 (2.2%)
//   ch_svc_stat DOMLT/CB/NBSS_ORD: avg 114ms, max 4,478ms

export const MOCK_METRICS: Record<string, Record<string, object>> = {
  BG008802: {
    // KOS-요금온라인: biz_svc_stat id=19 → 분당 ~10,000건
    request_count: {
      serviceId: 'BG008802', metricType: 'request_count',
      value: 10247, unit: 'req/min', trend: 3.2,
      chartData: makeChart(10000, 0.12),
      updatedAt: new Date().toISOString(),
    },
    // err_s/deal_i: 실데이터에서 err_s ~0, 시나리오상 간헐적 스파이크
    error_rate: {
      serviceId: 'BG008802', metricType: 'error_rate',
      value: 0.32, unit: '%', trend: 1.8,
      chartData: makeErrorRateChart(0.25),
      updatedAt: new Date().toISOString(),
    },
    response_time: {
      serviceId: 'BG008802', metricType: 'response_time',
      value: 1423, unit: 'ms', trend: -2.1,
      chartData: makeResponseTimeChart(1400),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG008802', metricType: 'traffic',
      value: 614820, unit: 'req/hr', trend: 1.5,
      chartData: makeChart(600000, 0.08),
      updatedAt: new Date().toISOString(),
    },
  },
  BG011706: {
    // KOS-유선공통: ch_ingrs_stat DOMLT/CB 1,645/min, err_e=36
    request_count: {
      serviceId: 'BG011706', metricType: 'request_count',
      value: 1645, unit: 'req/min', trend: -0.8,
      chartData: makeChart(1600, 0.18),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG011706', metricType: 'error_rate',
      value: 2.19, unit: '%', trend: 12.5,
      chartData: makeErrorRateChart(1.8, 17),
      updatedAt: new Date().toISOString(),
    },
    // ch_svc_stat DOMLT/CB/NBSS_ORD: avg 114ms, max 4,478ms
    response_time: {
      serviceId: 'BG011706', metricType: 'response_time',
      value: 342, unit: 'ms', trend: 8.3,
      chartData: makeResponseTimeChart(300),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG011706', metricType: 'traffic',
      value: 98700, unit: 'req/hr', trend: -1.2,
      chartData: makeChart(98000, 0.1),
      updatedAt: new Date().toISOString(),
    },
  },
  BG011701: {
    // KOS-무선오더: ch_ingrs_stat DOMORDER/OT 10,841/min
    request_count: {
      serviceId: 'BG011701', metricType: 'request_count',
      value: 10841, unit: 'req/min', trend: 2.1,
      chartData: makeChart(10800, 0.1),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG011701', metricType: 'error_rate',
      value: 0.05, unit: '%', trend: -0.3,
      chartData: makeErrorRateChart(0.04),
      updatedAt: new Date().toISOString(),
    },
    response_time: {
      serviceId: 'BG011701', metricType: 'response_time',
      value: 298, unit: 'ms', trend: -1.5,
      chartData: makeResponseTimeChart(280),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG011701', metricType: 'traffic',
      value: 650460, unit: 'req/hr', trend: 2.1,
      chartData: makeChart(650000, 0.08),
      updatedAt: new Date().toISOString(),
    },
  },
  BG009102: {
    // KOS-B2C CRM: ch_ingrs_stat DOMB2CCRM/UI 397/min
    request_count: {
      serviceId: 'BG009102', metricType: 'request_count',
      value: 397, unit: 'req/min', trend: -1.2,
      chartData: makeChart(400, 0.2),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG009102', metricType: 'error_rate',
      value: 3.42, unit: '%', trend: 45.2,
      chartData: makeErrorRateChart(2.8, 18),
      updatedAt: new Date().toISOString(),
    },
    response_time: {
      serviceId: 'BG009102', metricType: 'response_time',
      value: 1464, unit: 'ms', trend: 5.8,
      chartData: makeResponseTimeChart(1200),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG009102', metricType: 'traffic',
      value: 23820, unit: 'req/hr', trend: -1.2,
      chartData: makeChart(24000, 0.15),
      updatedAt: new Date().toISOString(),
    },
  },
  BG008702: {
    // KOS-통합고객: ch_ingrs_stat DOMB2CCRM/OM 19,820/min
    request_count: {
      serviceId: 'BG008702', metricType: 'request_count',
      value: 19820, unit: 'req/min', trend: 0.5,
      chartData: makeChart(19800, 0.08),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG008702', metricType: 'error_rate',
      value: 0.02, unit: '%', trend: -0.1,
      chartData: makeErrorRateChart(0.02),
      updatedAt: new Date().toISOString(),
    },
    response_time: {
      serviceId: 'BG008702', metricType: 'response_time',
      value: 419, unit: 'ms', trend: -0.3,
      chartData: makeResponseTimeChart(420),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG008702', metricType: 'traffic',
      value: 1189200, unit: 'req/hr', trend: 0.5,
      chartData: makeChart(1190000, 0.06),
      updatedAt: new Date().toISOString(),
    },
  },
  BG009201: {
    // KOS-B2B CRM: ch_ingrs_stat DOMB2BCRM → 저트래픽
    request_count: {
      serviceId: 'BG009201', metricType: 'request_count',
      value: 85, unit: 'req/min', trend: 0.8,
      chartData: makeChart(85, 0.25),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG009201', metricType: 'error_rate',
      value: 0.12, unit: '%', trend: 0.0,
      chartData: makeErrorRateChart(0.1),
      updatedAt: new Date().toISOString(),
    },
    // ch_svc_stat: DOMB2BCRM 평균응답 ~200ms
    response_time: {
      serviceId: 'BG009201', metricType: 'response_time',
      value: 215, unit: 'ms', trend: -2.3,
      chartData: makeResponseTimeChart(200),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG009201', metricType: 'traffic',
      value: 5100, unit: 'req/hr', trend: 0.8,
      chartData: makeChart(5000, 0.2),
      updatedAt: new Date().toISOString(),
    },
  },
  BG009001: {
    // KOS-물류: ch_ingrs_stat DOMRDS/ME 2,081/min
    request_count: {
      serviceId: 'BG009001', metricType: 'request_count',
      value: 2081, unit: 'req/min', trend: 1.0,
      chartData: makeChart(2000, 0.12),
      updatedAt: new Date().toISOString(),
    },
    error_rate: {
      serviceId: 'BG009001', metricType: 'error_rate',
      value: 0.08, unit: '%', trend: -0.5,
      chartData: makeErrorRateChart(0.07),
      updatedAt: new Date().toISOString(),
    },
    response_time: {
      serviceId: 'BG009001', metricType: 'response_time',
      value: 139, unit: 'ms', trend: -0.2,
      chartData: makeResponseTimeChart(140),
      updatedAt: new Date().toISOString(),
    },
    traffic: {
      serviceId: 'BG009001', metricType: 'traffic',
      value: 124860, unit: 'req/hr', trend: 1.0,
      chartData: makeChart(125000, 0.1),
      updatedAt: new Date().toISOString(),
    },
  },
};

// ── Incidents ────────────────────────────────────────────────
// 소스: mo_alarm_hst (실제 발생) + mo_alarm_cond (조건 정의 기반 시나리오)
// alarm_lvl 매핑: Critical/Fatal → critical, Major → warning, Minor → info

export const MOCK_INCIDENTS = {
  incidents: [
    // ─ Critical ─────────────────────────────────
    {
      // mo_alarm_hst: alarm_id=46, 72건 반복 발생, thrs=30 vs value=329,415
      id: 'inc-001',
      alarmId: '46',
      alarmHstSeq: '11769',
      serviceId: 'BG008802',
      serviceName: 'KOS-요금온라인',
      alarmName: '요금온라인 전체 서비스 시스템오류 10분간 30건 이상 발생',
      alarmDesc: '[요금온라인 AP][ESB - Integration] 최근 10분 서비스[전체]OP[전체] 시스템오류 30건 이상 발생',
      alarmContent: '[PROBLEM][Minor BMON알람] KOS-요금온라인:요금온라인 전체 서비스 시스템오류 10분간 30 이상 발생\n\n단위서비스 : (BG008802)KOS-요금온라인\n알람등급 : Minor\n검출기준 : CALL건수(10분간)\n임계 설정 값 : 30 이상\n알림 발생 값 : 329,415',
      detectType: 'CALL_CASCNT' as const,
      detectTerm: 'MIN10' as const,
      threshold: 30,
      thresholdValue: 329415,
      changePercent: 1098050,
      severity: 'fatal' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(8),
    },
    {
      // mo_alarm_cond: alarm_id=51, KOS 모바일 신규개통 시스템오류
      id: 'inc-002',
      alarmId: '51',
      alarmHstSeq: '12001',
      serviceId: 'BG011701',
      serviceName: 'KOS-무선오더',
      alarmName: 'KOS 모바일 신규개통 시스템오류',
      alarmDesc: '[ORD] 채널:전체 PL_MblNewSbscMegaSvc 시스템오류 5분간 50건 이상',
      alarmContent: '[PROBLEM][Critical BMON알람] KOS-무선오더:KOS 모바일 신규개통 시스템오류\n\n단위서비스 : (BG011701)KOS-무선오더\n알람등급 : Critical\n검출APP : NBSS_ORD\n검출기준 : 시스템오류건수(5분간)\n임계 설정 값 : 50 이상\n알림 발생 값 : 127',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN5' as const,
      threshold: 50,
      thresholdValue: 127,
      changePercent: 154,
      severity: 'critical' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(3),
    },
    {
      // mo_alarm_hst: alarm_id=174, 대리점 조회 오류
      id: 'inc-003',
      alarmId: '174',
      alarmHstSeq: '8820',
      serviceId: 'BG009001',
      serviceName: 'KOS-물류',
      alarmName: '대리점 조회 오류',
      alarmDesc: '[CIT][KOS-물류] 대리점 조회 시스템 오류 5분간 30건 이상',
      alarmContent: '[PROBLEM][Critical BMON알람] KOS-물류:대리점 조회 오류\n\n단위서비스 : (BG009001)KOS-물류\n알람등급 : Critical\n검출APP : NBSS_CIT\n검출기준 : 시스템오류건수(5분간)\n임계 설정 값 : 30 이상\n알림 발생 값 : 85',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN5' as const,
      threshold: 30,
      thresholdValue: 85,
      changePercent: 183,
      severity: 'critical' as const,
      status: 'acknowledged' as const,
      clearYn: false,
      occurredAt: T(22),
      ackedAt: T(18),
      ackedBy: '82022082',
    },
    {
      // mo_alarm_cond: alarm_id=87, KOS 무선오더 해지 시스템 오류
      id: 'inc-004',
      alarmId: '87',
      alarmHstSeq: '12015',
      serviceId: 'BG011701',
      serviceName: 'KOS-무선오더',
      alarmName: 'KOS 무선오더 해지 시스템 오류',
      alarmDesc: '[ORD] PL_TrmnPrcsItg 시스템오류 5분간 50건 이상',
      alarmContent: '[PROBLEM][Critical BMON알람] KOS-무선오더:KOS 무선오더 해지 시스템 오류\n\n단위서비스 : (BG011701)KOS-무선오더\n알람등급 : Critical\n검출기준 : 시스템오류건수(5분간)\n임계 설정 값 : 50 이상\n알림 발생 값 : 73',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN5' as const,
      threshold: 50,
      thresholdValue: 73,
      changePercent: 46,
      severity: 'critical' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(5),
    },

    // ─ Warning (Major) ──────────────────────────
    {
      // mo_alarm_hst: alarm_id=145, 청구요금조회 시스템오류
      id: 'inc-005',
      alarmId: '145',
      alarmHstSeq: '11502',
      serviceId: 'BG008802',
      serviceName: 'KOS-요금온라인',
      alarmName: '청구요금조회 관련 서비스 시스템오류',
      alarmDesc: '[요금온라인][PL_ChageInfoAdm] 시스템오류 분당 15건 이상',
      alarmContent: '[PROBLEM][Major BMON알람] KOS-요금온라인:청구요금조회 관련 서비스 시스템오류_major\n\n단위서비스 : (BG008802)KOS-요금온라인\n알람등급 : Major\n검출APP : NBSS_ARO\n검출서비스명 : /BCC/PipelineSVC/NCID/Bill/PL_ChageInfoAdm\n검출기준 : 시스템오류건수(1분간)\n임계 설정 값 : 15 이상\n알림 발생 값 : 20',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN1' as const,
      threshold: 15,
      thresholdValue: 20,
      changePercent: 33,
      severity: 'major' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(12),
    },
    {
      // mo_alarm_cond: alarm_id=191, NBSS_SMS B2C PO 오류율 10% 이상
      id: 'inc-006',
      alarmId: '191',
      alarmHstSeq: '12030',
      serviceId: 'BG009102',
      serviceName: 'KOS-B2C CRM',
      alarmName: 'NBSS_SMS B2C PO 1시간내 오류 10% 이상',
      alarmDesc: '[B2C CRM][NBSS_SMS] 1시간내 오류율 10% 이상',
      alarmContent: '[PROBLEM][Major BMON알람] KOS-B2C CRM:NBSS_SMS B2C PO 1시간내 오류 10% 이상\n\n단위서비스 : (BG009102)KOS-B2C CRM\n알람등급 : Major\n검출APP : NBSS_SMS\n검출기준 : 오류율(1시간)\n임계 설정 값 : 10% 이상\n알림 발생 값 : 15.3%',
      detectType: 'ERR_RATE' as const,
      detectTerm: 'HOUR1' as const,
      threshold: 10,
      thresholdValue: 15.3,
      changePercent: 53,
      severity: 'major' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(25),
    },
    {
      // mo_alarm_cond: alarm_id=292, 마이페이지 요금납부 비즈니스 오류
      id: 'inc-007',
      alarmId: '292',
      alarmHstSeq: '12045',
      serviceId: 'BG008802',
      serviceName: 'KOS-요금온라인',
      alarmName: '마이페이지 요금납부 비즈니스 오류 증가',
      alarmDesc: '[요금온라인][/BCC/PL_RmnyMgt] ME 채널 비즈니스 오류 1시간 100건 이상',
      alarmContent: '[PROBLEM][Major BMON알람] KOS-요금온라인:마이페이지 요금납부 비즈니스 오류 증가\n\n단위서비스 : (BG008802)KOS-요금온라인\n알람등급 : Major\n검출채널 : ME\n검출서비스명 : /BCC/PipelineSVC/NRMN/PL_RmnyMgt\n검출기준 : 비즈니스오류건수(1시간)\n임계 설정 값 : 100 이상\n알림 발생 값 : 156',
      detectType: 'ERR_E' as const,
      detectTerm: 'HOUR1' as const,
      threshold: 100,
      thresholdValue: 156,
      changePercent: 56,
      severity: 'major' as const,
      status: 'acknowledged' as const,
      clearYn: false,
      occurredAt: T(40),
      ackedAt: T(32),
      ackedBy: '82273989',
    },
    {
      // mo_alarm_cond: alarm_id=3, KOS-CDM KAIT 부정가입방지
      id: 'inc-008',
      alarmId: '3',
      alarmHstSeq: '12060',
      serviceId: 'BG008702',
      serviceName: 'KOS-통합고객',
      alarmName: 'KOS-CDM 시스템오류 KAIT 부정가입방지',
      alarmDesc: '[CDM][PL_CustFraudSbscPrvnAthn] KAIT 부정가입방지 시스템오류 5분간 800건 이상',
      alarmContent: '[PROBLEM][Major BMON알람] KOS-통합고객:KOS-CDM 시스템오류 KAIT 부정가입방지\n\n단위서비스 : (BG008702)KOS-통합고객\n알람등급 : Major\n검출APP : NBSS_CDM\n검출서비스명 : /CDM/PipelineSVC/NACT/CustFraud/PL_CustFraudSbscPrvnAthn\n검출기준 : 시스템오류건수(5분간)\n임계 설정 값 : 800 이상\n알림 발생 값 : 952',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN5' as const,
      threshold: 800,
      thresholdValue: 952,
      changePercent: 19,
      severity: 'major' as const,
      status: 'resolved' as const,
      clearYn: true,
      clearDt: T(55),
      occurredAt: T(90),
      resolvedAt: T(60),
      resolvedBy: '82022029',
      resolution: 'KAIT 인증 서버 측 일시 장애. 15:20 KAIT 측 복구 확인 후 알람 자동 해소.',
    },

    // ─ Info (Minor) ──────────────────────────────
    {
      // mo_alarm_cond: alarm_id=16, RDS 평균응답시간
      id: 'inc-009',
      alarmId: '16',
      alarmHstSeq: '12070',
      serviceId: 'BG009001',
      serviceName: 'KOS-물류',
      alarmName: 'RDS 평균응답시간 3초 초과',
      alarmDesc: 'RDS 평균응답시간 10분간 3,000ms 초과',
      alarmContent: '[PROBLEM][Minor BMON알람] KOS-물류:RDS 평균응답시간\n\n단위서비스 : (BG009001)KOS-물류\n알람등급 : Minor\n검출기준 : 평균응답시간(10분간)\n임계 설정 값 : 3000ms 이상\n알림 발생 값 : 4,521ms',
      detectType: 'RPY_TIME' as const,
      detectTerm: 'MIN10' as const,
      threshold: 3000,
      thresholdValue: 4521,
      changePercent: 50.7,
      severity: 'minor' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(18),
    },
    {
      // mo_alarm_hst: alarm_id=42, 유선 PL_GenrlCrdtClas 오류
      id: 'inc-010',
      alarmId: '42',
      alarmHstSeq: '7850',
      serviceId: 'BG011706',
      serviceName: 'KOS-유선공통',
      alarmName: '[유선] PL_GenrlCrdtClas 오류 5건 이상 발생',
      alarmDesc: '[유선/인터넷][/ORD/PipelineSVC/PL_GenrlCrdtClas] 오류 분당 5건 이상',
      alarmContent: '[PROBLEM][Minor BMON알람] KOS-유선공통:[유선][PL_GenrlCrdtClas] 오류 5건 이상 발생\n\n단위서비스 : (BG011706)KOS-유선공통\n알람등급 : Minor\n검출서비스명 : /ORD/PipelineSVC/NWRC/WrlinComn/CrdtInfoAdm/PL_GenrlCrdtClas\n검출기준 : 시스템오류건수(1분간)\n임계 설정 값 : 5 이상\n알림 발생 값 : 11',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN1' as const,
      threshold: 5,
      thresholdValue: 11,
      changePercent: 120,
      severity: 'minor' as const,
      status: 'muted' as const,
      clearYn: true,
      clearDt: T(50),
      occurredAt: T(75),
      mutedUntil: new Date(Date.now() + 120 * 60_000).toISOString(),
      mutedBy: '82022899',
    },
    {
      // mo_alarm_hst: alarm_id=47, 요금온라인 청구월별요금내역
      id: 'inc-011',
      alarmId: '47',
      alarmHstSeq: '9310',
      serviceId: 'BG008802',
      serviceName: 'KOS-요금온라인',
      alarmName: '요금온라인_청구월별요금내역 서비스 확인',
      alarmDesc: '[요금온라인][ChageTxnByBillTgtYmSO] CALL건수 5분간 30건 이상',
      alarmContent: '[PROBLEM][Minor BMON알람] KOS-요금온라인:요금온라인_청구월별요금내역 서비스 확인\n\n단위서비스 : (BG008802)KOS-요금온라인\n알람등급 : Minor\n검출APP : NBSS_ARO\n검출서비스명 : ChageTxnByBillTgtYmSO\n검출기준 : CALL건수(5분간)\n임계 설정 값 : 30 이상\n알림 발생 값 : 40',
      detectType: 'CALL_CASCNT' as const,
      detectTerm: 'MIN5' as const,
      threshold: 30,
      thresholdValue: 40,
      changePercent: 33,
      severity: 'minor' as const,
      status: 'resolved' as const,
      clearYn: true,
      clearDt: T(100),
      occurredAt: T(130),
      resolvedAt: T(105),
      resolvedBy: '82108697',
      resolution: '청구 데이터 정합성 확인 후 자동 해소. 정기 배치 처리 완료.',
    },
    {
      // mo_alarm_cond: alarm_id=295, [유선/인터넷] OSS 프리오더링
      id: 'inc-012',
      alarmId: '295',
      alarmHstSeq: '12080',
      serviceId: 'BG011706',
      serviceName: 'KOS-유선공통',
      alarmName: '[유선/인터넷] OSS 프리오더링 시스템오류',
      alarmDesc: '[ORD][CO채널] PL_InetFcltInfoByEqpAdrRetv 시스템오류 5분간 30건 이상',
      alarmContent: '[PROBLEM][Critical BMON알람] KOS-유선공통:[유선/인터넷] OSS 프리오더링\n\n단위서비스 : (BG011706)KOS-유선공통\n알람등급 : Critical\n검출APP : NBSS_ORD\n검출채널 : CO\n검출서비스명 : /ORD/PipelineSVC/NINT/IntmSbsc/inet/PL_InetFcltInfoByEqpAdrRetv\n검출기준 : 시스템오류건수(5분간)\n임계 설정 값 : 30 이상\n알림 발생 값 : 48',
      detectType: 'ERR_S' as const,
      detectTerm: 'MIN5' as const,
      threshold: 30,
      thresholdValue: 48,
      changePercent: 60,
      severity: 'major' as const,
      status: 'open' as const,
      clearYn: false,
      occurredAt: T(15),
    },
  ],
  totalElements: 12,
  totalPages: 1,
  currentPage: 0,
};

export const MOCK_CRITICAL_CHECK = {
  hasCritical: true,
  criticalCount: 4,
  latestOccurredAt: T(3),
};

// ── AI Analysis ──────────────────────────────────────────────
// LLM 응답 형태의 분석 결과 (사내망 LLM 연동 전제)
// 메트릭 드릴다운: bmonown.mo_bymi_ch_svc_stat 기반

export const MOCK_AI_ANALYSIS: Record<string, object> = {
  'inc-001': {
    incidentId: 'inc-001',
    status: 'completed',
    progress: 100,
    result: {
      whatChanged: [
        'KOS-요금온라인(BG008802) CALL건수가 임계값 30건 대비 329,415건 발생 (10,980배 초과)',
        'DOMORDER 도메인의 분당 트랜잭션이 평균 10,247건에서 15분 전부터 급증',
        '동일 alarm_id(46) 기준 최근 30일간 72회 반복 발생 이력 확인',
      ],
      whyHappened: [
        { cause: 'ESB Integration 구간 대량 호출 누적 — DOMORDER/OT 채널에서 분당 10,841건 유입 중 타임아웃 전파', confidence: 0.89 },
        { cause: '요금 청구 배치 처리와 실시간 조회 동시 수행으로 DB 커넥션 풀 포화', confidence: 0.74 },
        { cause: 'CALL_CASCNT 감지 방식이 정상/오류 구분 없이 전체 호출을 카운트하여 과탐지 가능성', confidence: 0.56 },
      ],
      similarCases: [
        {
          date: '2024-03-25',
          alarmName: '요금온라인 전체 서비스 시스템오류 10분간 30 이상 발생',
          serviceName: 'KOS-요금온라인',
          thresholdValue: 211228,
          clearYn: false,
          resolution: undefined,
        },
        {
          date: '2024-05-05',
          alarmName: '요금온라인_청구월별요금내역 서비스 확인',
          serviceName: 'KOS-요금온라인',
          thresholdValue: 40,
          clearYn: true,
          resolution: '청구 데이터 정합성 확인 후 자동 해소',
        },
        {
          date: '2024-04-23',
          alarmName: '요금온라인 전체 서비스 시스템오류 10분간 30 이상 발생',
          serviceName: 'KOS-요금온라인',
          thresholdValue: 359123,
          clearYn: false,
          resolution: undefined,
        },
      ],
      recommendedActions: [
        'ESB Integration 구간 rate limiting 적용 검토 (현재 분당 10,000건 이상 무제한 유입)',
        '임계값(30건)이 실제 트래픽(분당 10,000건+) 대비 과도하게 낮음 — ERR_S 기반 감지로 변경하거나 임계값 10,000건 이상으로 상향 필요',
        '요금 청구 배치 시간대(20:00~22:00)에는 알람 감지 정책을 분리하여 알람 피로도 감소',
        '동일 알람 반복 발생 시 자동 그룹핑(Compression) 정책 강화 검토',
      ],
      alarmPattern: {
        totalOccurrences: 72,
        autoClearRate: 25,
        avgClearMinutes: 15,
        peakHour: '20:00-22:00',
        peakDayOfWeek: '월요일',
        recentTrend: 'increasing' as const,
      },
    },
  },
  'inc-002': {
    incidentId: 'inc-002',
    status: 'completed',
    progress: 100,
    result: {
      whatChanged: [
        'KOS-무선오더(BG011701) PL_MblNewSbscMegaSvc 시스템오류 5분간 127건 발생 (임계 50건 초과)',
        'DOMORDER/OT 채널 분당 트래픽 10,841건 중 모바일 신규개통 오퍼레이션에서 집중 오류',
        '직전 5분 대비 ERR_S 건수 154% 증가',
      ],
      whyHappened: [
        { cause: 'PL_MblNewSbscMegaSvc 파이프라인 내부 외부 시스템(번호이동센터) 연동 타임아웃', confidence: 0.85 },
        { cause: 'NBSS_ORD 앱 서버 GC 발생으로 인한 일시적 처리 지연 전파', confidence: 0.68 },
      ],
      similarCases: [
        {
          date: '2025-11-12',
          alarmName: 'KOS 무선오더 해지 시스템 오류',
          serviceName: 'KOS-무선오더',
          thresholdValue: 65,
          clearYn: true,
          resolution: 'NBSS_ORD 서버 재기동 후 정상화',
        },
      ],
      recommendedActions: [
        '번호이동센터 연동 구간 Circuit Breaker 적용 (현재 타임아웃 시 무한 재시도)',
        'NBSS_ORD 앱 서버 JVM 힙 메모리 및 GC 로그 확인',
        'PL_MblNewSbscMegaSvc 파이프라인 fallback 처리 로직 점검',
      ],
      alarmPattern: {
        totalOccurrences: 5,
        autoClearRate: 40,
        avgClearMinutes: 8,
        peakHour: '10:00-12:00',
        peakDayOfWeek: '화요일',
        recentTrend: 'increasing' as const,
      },
    },
  },
  'inc-003': {
    incidentId: 'inc-003',
    status: 'completed',
    progress: 100,
    result: {
      whatChanged: [
        'KOS-물류(BG009001) 대리점 조회 시스템오류 5분간 85건 발생 (임계 30건 초과)',
        'NBSS_CIT 앱에서 DOMRDS/ME 채널 경유 조회 실패',
      ],
      whyHappened: [
        { cause: 'RDS(Reference Data Service) 서버 응답 지연 — 평균 응답시간 4,521ms로 임계 3,000ms 초과 중', confidence: 0.92 },
        { cause: '대리점 마스터 데이터 동기화 배치와 실시간 조회 경합', confidence: 0.71 },
      ],
      similarCases: [
        {
          date: '2024-03-04',
          alarmName: '대리점 조회 오류',
          serviceName: 'KOS-물류',
          thresholdValue: 0,
          clearYn: true,
          resolution: 'RDS 서버 재기동 후 정상화',
        },
      ],
      recommendedActions: [
        'RDS 서버 부하 상태 확인 — inc-009(RDS 응답시간 초과)과 동일 원인일 가능성 높음',
        '대리점 마스터 동기화 배치 스케줄을 비업무 시간대로 조정',
        'NBSS_CIT → RDS 조회 구간에 캐싱 레이어 도입 검토',
      ],
      alarmPattern: {
        totalOccurrences: 3,
        autoClearRate: 67,
        avgClearMinutes: 12,
        peakHour: '09:00-10:00',
        peakDayOfWeek: '월요일',
        recentTrend: 'stable' as const,
      },
    },
  },
};

// ── Chat History ─────────────────────────────────────────────
// 사내망 LLM 응답 형태, 실제 메트릭/알람 데이터 참조

export const MOCK_CHAT_HISTORY = {
  messages: [
    {
      id: 'msg-1',
      type: 'user' as const,
      content: '현재 Critical 인시던트 현황 알려줘',
      createdAt: T(30),
    },
    {
      id: 'msg-2',
      type: 'ai' as const,
      content: `**현재 Critical 인시던트 4건** 발생 중입니다.

| # | 서비스 | 알람명 | 임계초과 | 상태 | 발생시각 |
|---|--------|--------|---------|------|---------|
| 1 | KOS-요금온라인 | 시스템오류 10분간 30건↑ | 329,415건 (10,980배) | **Open** | ${T(8).substring(11, 16)} |
| 2 | KOS-무선오더 | 모바일 신규개통 오류 | 127건 (2.5배) | **Open** | ${T(3).substring(11, 16)} |
| 3 | KOS-물류 | 대리점 조회 오류 | 85건 (2.8배) | **ACK** | ${T(22).substring(11, 16)} |
| 4 | KOS-무선오더 | 해지 시스템 오류 | 73건 (1.5배) | **Open** | ${T(5).substring(11, 16)} |

**긴급 조치 권장:**
- inc-001(요금온라인): 임계값(30건)이 실 트래픽 대비 과소 설정. 즉시 임계값 상향 또는 ERR_S 기반 감지로 전환 필요
- inc-002, inc-004(무선오더): 동일 서비스에서 신규개통+해지 동시 오류 — NBSS_ORD 앱 서버 상태 확인 우선`,
      createdAt: T(29),
    },
    {
      id: 'msg-3',
      type: 'user' as const,
      content: 'KOS-요금온라인 최근 트래픽 추이는?',
      createdAt: T(15),
    },
    {
      id: 'msg-4',
      type: 'ai' as const,
      content: `**KOS-요금온라인(BG008802) 트래픽 현황** (최근 1시간)

| 메트릭 | 현재값 | 추이 |
|--------|--------|------|
| 트랜잭션 | 10,247 req/min | +3.2% ↑ |
| 에러율 | 0.32% | +1.8% ↑ |
| 평균응답시간 | 1,423ms | -2.1% ↓ |
| 시간당 트래픽 | 614,820 req/hr | +1.5% ↑ |

**채널별 유입 분포** (DOMORDER 기준):
- OT(온라인): 10,841/min (최대)
- SH(쇼핑): 5,002/min
- OF(오프라인): 3,765/min
- KN(KT닷컴): 3,477/min

**분석:** 전반적으로 정상 트래픽 범위이나, alarm_id=46이 CALL_CASCNT(호출건수) 기반 감지로 정상 트래픽도 알람 유발 중. ERR_S(시스템오류) 기반 감지로 전환 시 알람 피로도 대폭 감소 예상.`,
      createdAt: T(14),
    },
  ],
  totalElements: 4,
  currentPage: 0,
  totalPages: 1,
};

// ── Settings: Thresholds ─────────────────────────────────────
// 소스: mo_alarm_cond의 실제 임계값 + bmonown.mo 메트릭 기반 적정값

export const MOCK_THRESHOLDS = {
  thresholds: [
    {
      serviceId: 'BG008802', serviceName: 'KOS-요금온라인',
      errorRate: 30,       // mo_alarm_cond alarm_id=46: thrs=30 (CALL_CASCNT)
      responseTime: 3000,  // 일반적 임계 기준
      traffic: 500000,     // biz_svc_stat 시간당 ~600K 기준
    },
    {
      serviceId: 'BG011701', serviceName: 'KOS-무선오더',
      errorRate: 50,       // mo_alarm_cond alarm_id=51,87,94: thrs=50
      responseTime: 2000,
      traffic: 650000,     // ch_ingrs_stat DOMORDER/OT 10,841/min 기준
    },
    {
      serviceId: 'BG008702', serviceName: 'KOS-통합고객',
      errorRate: 800,      // mo_alarm_cond alarm_id=3: thrs=800 (CDM KAIT)
      responseTime: 1000,
      traffic: 1200000,    // ch_ingrs_stat DOMB2CCRM/OM 19,820/min 기준
    },
    {
      serviceId: 'BG011706', serviceName: 'KOS-유선공통',
      errorRate: 5,        // mo_alarm_cond alarm_id=42 유사: thrs=5
      responseTime: 3000,
      traffic: 100000,     // ch_ingrs_stat DOMLT/CB 1,645/min 기준
    },
    {
      serviceId: 'BG009102', serviceName: 'KOS-B2C CRM',
      errorRate: 10,       // mo_alarm_cond alarm_id=191: thrs=10 (ERR_RATE)
      responseTime: 1500,  // ch_ingrs_stat DOMB2CCRM/UI max 1,464ms
      traffic: 25000,
    },
    {
      serviceId: 'BG009201', serviceName: 'KOS-B2B CRM',
      errorRate: 10,       // mo_alarm_cond alarm_id=18: thrs=10
      responseTime: 1500,  // mo_alarm_cond alarm_id=223: thrs=1500 (RPY_TIME)
      traffic: 5000,
    },
    {
      serviceId: 'BG009001', serviceName: 'KOS-물류',
      errorRate: 2,        // mo_alarm_cond alarm_id=5: thrs=2
      responseTime: 3000,  // mo_alarm_cond alarm_id=16: thrs=3000 (RPY_TIME)
      traffic: 125000,     // ch_ingrs_stat DOMRDS/ME 2,081/min 기준
    },
  ],
};

// ── Settings: Notifications ──────────────────────────────────
// 소스: mo_alarm_user의 rcv_type (SMS+EMAIL, SMS, EMAIL, NONE)
// Slack 제외 — 사내 SMS+EMAIL 시스템만 사용

export const MOCK_NOTIFICATIONS = {
  slackWebhookUrl: '',
  receivers: {
    critical: ['82022082', '82273989', '91256594', '82022899'],
    warning: ['82022082', '82273989', '82022029'],
    info: ['82022082'],
  },
};

// ── Settings: Users ──────────────────────────────────────────
// 소스: mo_alarm_user.xlsx의 실제 user_id + mo_alarm_group 매핑

export const MOCK_USERS = {
  users: [
    { id: '82022082', name: '김관제', email: 'kwanje82@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2023-08-25T09:00:00Z' },
    { id: '82273989', name: '이운영', email: 'leewoon@kt.com', role: 'ADMIN' as const, isActive: true, createdAt: '2023-08-25T09:00:00Z' },
    { id: '91256594', name: '박시스템', email: 'parksys@kt.com', role: 'ADMIN' as const, isActive: true, createdAt: '2023-08-25T09:00:00Z' },
    { id: '82022029', name: '최실적', email: 'choisil@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2024-01-15T09:00:00Z' },
    { id: '82022899', name: '정유선', email: 'jungyoo@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2024-01-26T09:00:00Z' },
    { id: '82108697', name: '강개발', email: 'kangdev@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2024-02-02T09:00:00Z' },
    { id: '82267289', name: '윤모바', email: 'yoonmob@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2024-03-01T09:00:00Z' },
    { id: '82022006', name: '한비투', email: 'hanb2c@kt.com', role: 'VIEWER' as const, isActive: true, createdAt: '2024-03-15T09:00:00Z' },
    { id: '82022136', name: '송물류', email: 'songmul@kt.com', role: 'VIEWER' as const, isActive: true, createdAt: '2024-05-01T09:00:00Z' },
    { id: '82034632', name: '임비투비', email: 'limb2b@kt.com', role: 'VIEWER' as const, isActive: false, createdAt: '2024-06-01T09:00:00Z' },
    { id: '82061387', name: '오에스엠', email: 'ohsms@kt.com', role: 'OPERATOR' as const, isActive: true, createdAt: '2024-08-22T09:00:00Z' },
    { id: '116901375', name: '서신입', email: 'seoshin@kt.com', role: 'VIEWER' as const, isActive: true, createdAt: '2025-12-19T09:00:00Z' },
  ],
  totalElements: 12,
  totalPages: 2,
  currentPage: 0,
};

// ── Dashboard Summary ────────────────────────────────────────
// mo_alarm_hst 집계 기반, days 파라미터별 분리

const RECENT_CRITICAL = [
    {
      id: 'inc-002', alarmHstSeq: '12001',
      serviceId: 'BG011701', serviceName: 'KOS-무선오더',
      alarmName: 'KOS 모바일 신규개통 시스템오류',
      severity: 'critical',
      detectType: 'ERR_S', threshold: 50, thresholdValue: 127,
      occurredAt: T(3),
    },
    {
      id: 'inc-004', alarmHstSeq: '12015',
      serviceId: 'BG011701', serviceName: 'KOS-무선오더',
      alarmName: 'KOS 무선오더 해지 시스템 오류',
      severity: 'critical',
      detectType: 'ERR_S', threshold: 50, thresholdValue: 73,
      occurredAt: T(5),
    },
    {
      id: 'inc-001', alarmHstSeq: '11769',
      serviceId: 'BG008802', serviceName: 'KOS-요금온라인',
      alarmName: '요금온라인 전체 서비스 시스템오류 10분간 30건 이상 발생',
      severity: 'fatal',
      detectType: 'CALL_CASCNT', threshold: 30, thresholdValue: 329415,
      occurredAt: T(8),
    },
    {
      id: 'inc-003', alarmHstSeq: '8820',
      serviceId: 'BG009001', serviceName: 'KOS-물류',
      alarmName: '대리점 조회 오류',
      severity: 'critical',
      detectType: 'ERR_S', threshold: 30, thresholdValue: 85,
      occurredAt: T(22),
    },
];

export function getMockDashboardSummary(days: number) {
  if (days === 1) {
    return {
      kpi: { totalIncidents: 7, activeIncidents: 5, criticalActive: 3, autoClearRate: 14.3 },
      severityCounts: [
        { severity: 'fatal',    count: 1 },
        { severity: 'critical', count: 2 },
        { severity: 'major',    count: 2 },
        { severity: 'minor',    count: 2 },
      ],
      serviceRanking: [
        { serviceId: 'BG011701', serviceName: 'KOS-무선오더',   count: 3 },
        { serviceId: 'BG008802', serviceName: 'KOS-요금온라인', count: 2 },
        { serviceId: 'BG009001', serviceName: 'KOS-물류',       count: 1 },
        { serviceId: 'BG011706', serviceName: 'KOS-유선공통',   count: 1 },
        { serviceId: 'BG009102', serviceName: 'KOS-B2C CRM',   count: 0 },
      ],
      detectTypeCounts: [
        { type: 'ERR_S',       label: '시스템오류', count: 5 },
        { type: 'CALL_CASCNT', label: '호출건수',   count: 1 },
        { type: 'ERR_RATE',    label: '오류율',     count: 1 },
        { type: 'RPY_TIME',    label: '응답시간',   count: 0 },
        { type: 'ERR_E',       label: '외부오류',   count: 0 },
      ],
      dailyTrend: [
        { date: '04-21', fatal: 1, critical: 2, major: 2, minor: 2 },
      ],
      recentCritical: RECENT_CRITICAL,
    };
  }

  if (days === 30) {
    return {
      kpi: { totalIncidents: 48, activeIncidents: 8, criticalActive: 4, autoClearRate: 68.8 },
      severityCounts: [
        { severity: 'fatal',    count: 4 },
        { severity: 'critical', count: 11 },
        { severity: 'major',    count: 18 },
        { severity: 'minor',    count: 15 },
      ],
      serviceRanking: [
        { serviceId: 'BG008802', serviceName: 'KOS-요금온라인', count: 16 },
        { serviceId: 'BG011701', serviceName: 'KOS-무선오더',   count: 12 },
        { serviceId: 'BG011706', serviceName: 'KOS-유선공통',   count: 8 },
        { serviceId: 'BG009001', serviceName: 'KOS-물류',       count: 7 },
        { serviceId: 'BG009102', serviceName: 'KOS-B2C CRM',   count: 5 },
      ],
      detectTypeCounts: [
        { type: 'ERR_S',       label: '시스템오류', count: 28 },
        { type: 'CALL_CASCNT', label: '호출건수',   count: 9 },
        { type: 'ERR_RATE',    label: '오류율',     count: 5 },
        { type: 'RPY_TIME',    label: '응답시간',   count: 4 },
        { type: 'ERR_E',       label: '외부오류',   count: 2 },
      ],
      dailyTrend: [
        { date: '03-23', fatal: 0, critical: 0, major: 1, minor: 1 },
        { date: '03-25', fatal: 0, critical: 1, major: 2, minor: 0 },
        { date: '03-27', fatal: 0, critical: 0, major: 1, minor: 2 },
        { date: '03-29', fatal: 1, critical: 1, major: 0, minor: 1 },
        { date: '03-31', fatal: 0, critical: 2, major: 3, minor: 2 },
        { date: '04-02', fatal: 0, critical: 0, major: 2, minor: 1 },
        { date: '04-04', fatal: 1, critical: 1, major: 1, minor: 0 },
        { date: '04-06', fatal: 0, critical: 1, major: 2, minor: 2 },
        { date: '04-08', fatal: 0, critical: 0, major: 1, minor: 1 },
        { date: '04-10', fatal: 0, critical: 1, major: 0, minor: 2 },
        { date: '04-12', fatal: 1, critical: 0, major: 2, minor: 1 },
        { date: '04-14', fatal: 0, critical: 1, major: 1, minor: 0 },
        { date: '04-16', fatal: 0, critical: 0, major: 1, minor: 2 },
        { date: '04-18', fatal: 0, critical: 1, major: 3, minor: 1 },
        { date: '04-21', fatal: 1, critical: 3, major: 4, minor: 4 },
      ],
      recentCritical: RECENT_CRITICAL,
    };
  }

  // days === 7 (default)
  return {
    kpi: { totalIncidents: 12, activeIncidents: 8, criticalActive: 4, autoClearRate: 25.0 },
    severityCounts: [
      { severity: 'fatal',    count: 1 },
      { severity: 'critical', count: 3 },
      { severity: 'major',    count: 4 },
      { severity: 'minor',    count: 4 },
    ],
    serviceRanking: [
      { serviceId: 'BG008802', serviceName: 'KOS-요금온라인', count: 4 },
      { serviceId: 'BG011701', serviceName: 'KOS-무선오더',   count: 3 },
      { serviceId: 'BG011706', serviceName: 'KOS-유선공통',   count: 2 },
      { serviceId: 'BG009001', serviceName: 'KOS-물류',       count: 2 },
      { serviceId: 'BG009102', serviceName: 'KOS-B2C CRM',   count: 1 },
    ],
    detectTypeCounts: [
      { type: 'ERR_S',       label: '시스템오류', count: 7 },
      { type: 'CALL_CASCNT', label: '호출건수',   count: 2 },
      { type: 'ERR_RATE',    label: '오류율',     count: 1 },
      { type: 'RPY_TIME',    label: '응답시간',   count: 1 },
      { type: 'ERR_E',       label: '외부오류',   count: 1 },
    ],
    dailyTrend: [
      { date: '04-15', fatal: 0, critical: 1, major: 2, minor: 0 },
      { date: '04-16', fatal: 0, critical: 0, major: 1, minor: 2 },
      { date: '04-17', fatal: 1, critical: 1, major: 0, minor: 1 },
      { date: '04-18', fatal: 0, critical: 1, major: 3, minor: 1 },
      { date: '04-19', fatal: 0, critical: 0, major: 1, minor: 2 },
      { date: '04-20', fatal: 1, critical: 1, major: 2, minor: 1 },
      { date: '04-21', fatal: 1, critical: 3, major: 4, minor: 4 },
    ],
    recentCritical: RECENT_CRITICAL,
  };
}

export const MOCK_DASHBOARD_SUMMARY = getMockDashboardSummary(7);

// ── Dashboard Hourly Trend (오늘 시간대별 인시던트 추이) ─────────
// 오늘(04-22) 실제 인시던트 발생 패턴 기반:
// - 새벽/이른아침: 거의 없음
// - 업무 시작(09시~): 점진적 증가
// - 오후(12~15시): Critical/Fatal 집중 발생 (현재 오픈 인시던트 기준)
// - 이후 시간대: 0 (미발생 / 미래)

export const MOCK_HOURLY_TREND = {
  hourlyTrend: [
    { hour: '00시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '01시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '02시', fatal: 0, critical: 0, major: 0, minor: 1 },
    { hour: '03시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '04시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '05시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '06시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '07시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '08시', fatal: 0, critical: 0, major: 1, minor: 0 },
    { hour: '09시', fatal: 0, critical: 1, major: 0, minor: 1 },
    { hour: '10시', fatal: 0, critical: 0, major: 1, minor: 2 },
    { hour: '11시', fatal: 0, critical: 0, major: 0, minor: 1 },
    { hour: '12시', fatal: 0, critical: 1, major: 1, minor: 0 },
    { hour: '13시', fatal: 0, critical: 1, major: 1, minor: 1 },
    { hour: '14시', fatal: 1, critical: 1, major: 0, minor: 1 },
    { hour: '15시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '16시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '17시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '18시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '19시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '20시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '21시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '22시', fatal: 0, critical: 0, major: 0, minor: 0 },
    { hour: '23시', fatal: 0, critical: 0, major: 0, minor: 0 },
  ],
};
