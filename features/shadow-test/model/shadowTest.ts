/**
 * @file shadowTest.ts
 * @description Shadow Test mock 데이터 및 결정적 재생 로직
 *   - 정방향: 과거 발생값(thrs_value)을 후보 임계값으로 재판정 → 억제/잔존 시뮬레이션
 *   - 역방향: 활성인데 안 뜬 조건을 실측 최대값과 대조 → 도달불가 임계값 탐지
 *   BE(12장) 구현 전까지 FE mock으로 동작. 값은 mo_alarm_hst / bymi 스탯 예시 기반.
 * @module features/shadow-test/model
 */
import type {
  DomainDef, DomainId, ForwardCond, ReverseCond, ReplayMark,
  ForwardResult, Scorecard, ShadowPeriod, ShadowTestData,
} from '@/entities/shadow-test';

// ── 도메인 정의 (커스텀 Wall 기준) ──────────────────────────────
export const DOMAINS: DomainDef[] = [
  { id: 'all', label: '전체' },
  { id: 'wireless', label: '무선' },
  { id: 'fixed', label: '유선' },
  { id: 'billing', label: '요금' },
  { id: 'crm', label: 'CRM' },
  { id: 'logistics', label: '물류' },
];

const SVC_DOM: Record<string, DomainId> = {
  'KOS-무선오더': 'wireless',
  'KOS-유선공통': 'fixed',
  'KOS-요금온라인': 'billing',
  'KOS-통합고객': 'crm',
  'KOS-B2C CRM': 'crm',
  'KOS-B2B CRM': 'crm',
  'KOS-물류': 'logistics',
};
const domOf = (svc: string): DomainId => SVC_DOM[svc] ?? 'all';

// ── 정방향 조건 (전주 기준) — mo_alarm_hst/cond 실값 기반 ───────
// 실 발생 이력이 있는 조건(alarm_id 46·1·42·174 등)은 실측 thrs_value 범위·건수 사용
const FORWARD: ForwardCond[] = [
  // alarm_id=46 실측: 72회, 임계 30, thrs_value 38,303~366,428 (임계 대비 수천 배)
  { svc: 'KOS-요금온라인', name: '요금온라인 전체 서비스 시스템오류 (호출건수)', type: 'CALL_CASCNT', term: '10분', unit: '건', cur: 30, proposed: 150000, count: 72, vmin: 38303, vmax: 366428, riskCount: 0, verdict: 'strong', dom: 'billing' },
  { svc: 'KOS-요금온라인', name: '마이페이지 요금납부 비즈니스 오류 증가', type: 'ERR_E', term: '1시간', unit: '건', cur: 100, proposed: 160, count: 8, vmin: 104, vmax: 208, riskCount: 0, verdict: 'safe', dom: 'billing' },
  { svc: 'KOS-무선오더', name: 'KOS 무선오더 가입상품정보조회 시스템 오류 다량 발생', type: 'ERR_S', term: '5분', unit: '건', cur: 50, proposed: 120, count: 30, vmin: 52, vmax: 240, riskCount: 2, verdict: 'watch', dom: 'wireless' },
  { svc: 'KOS-무선오더', name: 'KOS 무선오더 기변 시스템 오류 다량 발생', type: 'ERR_S', term: '5분', unit: '건', cur: 50, proposed: 100, count: 18, vmin: 51, vmax: 150, riskCount: 1, verdict: 'safe', dom: 'wireless' },
  // alarm_id=42 실측: 9회, 임계 5, 자동해소 9건 (전형적 노이즈)
  { svc: 'KOS-유선공통', name: '[유선] Msafer PL_MsaferIfSnd 오류 5건 이상 발생', type: 'ERR_S', term: '1분', unit: '건', cur: 5, proposed: 30, count: 9, vmin: 6, vmax: 91, riskCount: 0, verdict: 'strong', dom: 'fixed' },
  { svc: 'KOS-유선공통', name: '[유선/인터넷] OSS 프리오더링 시스템오류 30건 이상', type: 'ERR_S', term: '5분', unit: '건', cur: 30, proposed: 60, count: 12, vmin: 31, vmax: 74, riskCount: 1, verdict: 'watch', dom: 'fixed' },
  // alarm_id=1 실측: 11회, 임계 1, thrs_value 604~수십만, 자동해소 11건
  { svc: 'KOS-통합고객', name: '통합고객 서비스 호출건수 확인', type: 'CALL_CASCNT', term: '5분', unit: '건', cur: 1, proposed: 5000, count: 11, vmin: 604, vmax: 486000, riskCount: 0, verdict: 'strong', dom: 'crm' },
  { svc: 'KOS-통합고객', name: '고객서비스납부정보조회SO 시스템 오류 다량 발생', type: 'ERR_S', term: '5분', unit: '건', cur: 300, proposed: 520, count: 6, vmin: 305, vmax: 540, riskCount: 0, verdict: 'safe', dom: 'crm' },
  { svc: 'KOS-B2C CRM', name: 'SMS 발송지연 확인 (평균응답)', type: 'RPY_TIME', term: '10분', unit: 'ms', cur: 10000, proposed: 13000, count: 9, vmin: 10100, vmax: 14200, riskCount: 0, verdict: 'safe', dom: 'crm' },
  { svc: 'KOS-B2B CRM', name: '월별매출전망조회 평균응답알람', type: 'RPY_TIME', term: '1일', unit: 'ms', cur: 500, proposed: 1200, count: 12, vmin: 520, vmax: 1400, riskCount: 0, verdict: 'strong', dom: 'crm' },
  // alarm_id=174 실측: 임계 30, thrs_value ~0~4,332 (스파이크성)
  { svc: 'KOS-물류', name: 'RDS 시스템오류 - 채권 다량 발생', type: 'ERR_S', term: '5분', unit: '건', cur: 30, proposed: 85, count: 14, vmin: 31, vmax: 260, riskCount: 1, verdict: 'safe', dom: 'logistics' },
];

// ── 역방향 조건 (침묵 의심) — mo_alarm_cond 고임계값 조건 기반 ──
const REVERSE: ReverseCond[] = [
  { svc: 'KOS-무선오더', name: 'KOS 무선오더 기가입상품조회 시스템 오류 다량 발생', type: 'ERR_S', term: '5분', unit: '건', cur: 500, obsMax: 38, flag: 'over', dom: 'wireless' },
  { svc: 'KOS-유선공통', name: '[유선] Msafer 오더연동 오류 500건 이상', type: 'ERR_S', term: '1분', unit: '건', cur: 500, obsMax: 9, flag: 'unreach', dom: 'fixed' },
  { svc: 'KOS-유선공통', name: '[유선] CrdtInfoAdm PL_CcardAth 오류 500건 이상', type: 'ERR_S', term: '1분', unit: '건', cur: 500, obsMax: 6, flag: 'unreach', dom: 'fixed' },
  { svc: 'KOS-요금온라인', name: '마이페이지 요금납부 비즈니스 오류 (외부오류)', type: 'ERR_E', term: '1시간', unit: '건', cur: 100, obsMax: 88, flag: 'near', dom: 'billing' },
  { svc: 'KOS-통합고객', name: 'KOS-CDM KAIT 부정가입방지 실명인증 시스템오류', type: 'ERR_S', term: '5분', unit: '건', cur: 800, obsMax: 52, flag: 'over', dom: 'crm' },
  { svc: 'KOS-B2C CRM', name: 'SRTT 호출건수 확인', type: 'CALL_CASCNT', term: '1일', unit: '건', cur: 10000, obsMax: 3240, flag: 'over', dom: 'crm' },
  { svc: 'KOS-B2B CRM', name: '관리고객사업장정보조회 평균응답알람', type: 'RPY_TIME', term: '1시간', unit: 'ms', cur: 1500, obsMax: 1430, flag: 'near', dom: 'crm' },
  { svc: 'KOS-물류', name: 'RDS 평균응답시간 알람', type: 'RPY_TIME', term: '10분', unit: 'ms', cur: 3000, obsMax: 640, flag: 'unreach', dom: 'logistics' },
];

// SVC_DOM 매핑 정합성 보정 (스펙 dom과 svc 매핑 불일치 방지)
FORWARD.forEach((c) => { c.dom = domOf(c.svc); });
REVERSE.forEach((r) => { r.dom = domOf(r.svc); });

// ── 결정적 재생 로직 ────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 과거 발생값을 로그분포로 생성 후 후보 임계값 기준으로 노이즈/위험/잔존 분류 */
function genMarks(spec: ForwardCond, scale: number, seed: number): ReplayMark[] {
  const rnd = mulberry32(seed);
  const n = Math.max(3, Math.round(spec.count * scale));
  const lmin = Math.log10(spec.vmin);
  const lmax = Math.log10(spec.vmax);
  const vals = Array.from({ length: n }, () => Math.round(10 ** (lmin + rnd() * (lmax - lmin))));
  vals.sort((a, b) => a - b);
  const supIdx = vals.map((v, i) => ({ v, i })).filter((o) => o.v < spec.proposed).map((o) => o.i);
  const rc = Math.min(Math.round(spec.riskCount * scale) || (spec.riskCount > 0 ? 1 : 0), supIdx.length);
  const riskSet = new Set(supIdx.slice(-rc));
  return vals.map((v, i): ReplayMark =>
    v >= spec.proposed ? { v, cls: 'keep' } : { v, cls: riskSet.has(i) ? 'risk' : 'noise' },
  );
}

const inDom = (dom: DomainId, sel: DomainId) => sel === 'all' || dom === sel;

/** 도메인별 정방향 조건 수 (탭 배지용) */
export function forwardCountByDomain(domId: DomainId): number {
  return domId === 'all' ? FORWARD.length : FORWARD.filter((c) => c.dom === domId).length;
}

/** 도메인·기간으로 필터링·재생한 Shadow Test 결과 */
export function getShadowTestData(domain: DomainId, period: ShadowPeriod): ShadowTestData {
  const scale = period === 'week' ? 1 : 1 / 6;

  const forward: ForwardResult[] = FORWARD
    .filter((c) => inDom(c.dom, domain))
    .map((cond, idx) => {
      const marks = genMarks(cond, scale, 1000 + FORWARD.indexOf(cond) * 7 + idx);
      return {
        cond,
        marks,
        noise: marks.filter((m) => m.cls === 'noise').length,
        risk: marks.filter((m) => m.cls === 'risk').length,
        keep: marks.filter((m) => m.cls === 'keep').length,
      };
    });

  const scorecard: Scorecard = forward.reduce<Scorecard>(
    (acc, f) => ({
      shown: acc.shown + 1,
      tot: acc.tot + f.marks.length,
      noise: acc.noise + f.noise,
      risk: acc.risk + f.risk,
      keep: acc.keep + f.keep,
    }),
    { shown: 0, tot: 0, noise: 0, risk: 0, keep: 0 },
  );

  const reverse = REVERSE.filter((r) => inDom(r.dom, domain));

  return { forward, reverse, scorecard };
}

/** 로그 스케일 위치(0~100%) */
export function logPos(v: number, lo: number, hi: number): number {
  return ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * 100;
}
