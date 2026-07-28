/**
 * @file types.ts
 * @description Shadow Test 관련 타입 정의
 * @module entities/shadow-test
 */

export type DomainId = 'all' | 'wireless' | 'fixed' | 'billing' | 'crm' | 'logistics';
export type ShadowPeriod = 'day' | 'week';
export type Verdict = 'strong' | 'watch' | 'safe';
export type RevFlag = 'unreach' | 'over' | 'near' | 'ok';
export type MarkClass = 'noise' | 'risk' | 'keep';

export interface DomainDef {
  id: DomainId;
  label: string;
}

/** 정방향(임계값 상향) 알람조건 스펙 */
export interface ForwardCond {
  svc: string;
  name: string;
  type: string;
  term: string;
  unit: string; // 건 | % | ms
  cur: number;
  proposed: number;
  count: number;
  vmin: number;
  vmax: number;
  riskCount: number;
  verdict: Verdict;
  dom: DomainId;
}

/** 리플레이 스트립의 개별 발생 마크 */
export interface ReplayMark {
  v: number;
  cls: MarkClass;
}

/** 정방향 조건 1건의 재생 결과 */
export interface ForwardResult {
  cond: ForwardCond;
  marks: ReplayMark[];
  noise: number;
  risk: number;
  keep: number;
}

/** 역방향(침묵 알람 탐지) 조건 */
export interface ReverseCond {
  svc: string;
  name: string;
  type: string;
  term: string;
  unit: string; // 건 | ms
  cur: number;
  obsMax: number;
  flag: RevFlag;
  dom: DomainId;
}

/** 상단 요약 성적표 */
export interface Scorecard {
  shown: number;
  tot: number;
  noise: number;
  risk: number;
  keep: number;
}

/** 도메인·기간별 Shadow Test 결과 묶음 */
export interface ShadowTestData {
  forward: ForwardResult[];
  reverse: ReverseCond[];
  scorecard: Scorecard;
}
