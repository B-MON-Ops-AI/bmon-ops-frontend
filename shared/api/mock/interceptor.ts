/**
 * @file interceptor.ts
 * @description Axios Mock 인터셉터 (개발 환경 전용)
 * @module shared/api/mock
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  MOCK_WIDGETS, MOCK_METRICS, MOCK_INCIDENTS, MOCK_CRITICAL_CHECK,
  MOCK_AI_ANALYSIS, MOCK_CHAT_HISTORY, getMockDashboardSummary, MOCK_HOURLY_TREND,
  MOCK_SERVICE_STATUSES, MOCK_ALARM_CONDITIONS,
} from '@/shared/api/mock/data';

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeAxiosResponse(data: unknown, config: InternalAxiosRequestConfig) {
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
}

// ── 알람 조건 AI 분석 응답 생성 ──────────────────────────────
function generateAlarmCondAnalysis(query: string): string {
  // query 파싱: "| 키: 값 | 키: 값 |" 형식
  const get = (key: string) => {
    const m = query.match(new RegExp(`${key}:\\s*([^|]+)`));
    return m ? m[1].trim() : '';
  };

  const alarmNm    = get('알람명');
  const level      = get('등급');
  const detectType = get('검출유형').split('(')[0].trim();
  const threshold  = get('임계값');
  const service    = get('서비스').split('(')[0].trim();

  const thrsNum = parseInt(threshold.replace(/[^0-9]/g, ''), 10) || 0;
  const term = threshold.includes('분') ? threshold.match(/\d+분/)?.[0] : threshold.split('/')[1] ?? '';

  // 검출유형별 + 등급별 분석 생성
  let causeAnalysis = '';
  let suggestion = '';
  let riskNote = '';

  if (detectType === 'ERR_S' || detectType === 'ERR_E') {
    if (thrsNum >= 300) {
      causeAnalysis = `현재 임계값 **${threshold}**은 해당 서비스의 정상 트래픽에서는 도달하기 어려운 수준입니다. 실제 오류가 발생하더라도 이 임계값을 초과하려면 대규모 장애가 동시에 발생해야 합니다.`;
      suggestion = `- 최근 30일 시스템오류 최대 발생량을 조회하여 **${Math.round(thrsNum * 0.3)}~${Math.round(thrsNum * 0.5)}건** 수준으로 하향 조정 검토\n- 또는 검출 주기를 현재보다 길게 설정하여 누적 오류 탐지 방식으로 전환`;
    } else if (thrsNum <= 5) {
      causeAnalysis = `임계값 **${threshold}**은 낮은 편으로, 서비스가 매우 안정적으로 운영 중이거나 해당 서비스 경로(Pipeline/OP)의 호출 자체가 현재 활성화되지 않았을 가능성이 있습니다.`;
      suggestion = `- 해당 서비스 경로가 실제로 호출되고 있는지 **ch_svc_stat 로그** 확인\n- 서비스 경로 변경 또는 기능 폐기 여부 개발팀 확인\n- 임계값은 적절하나 모니터링 대상 자체가 바뀐 경우 알람 재등록 필요`;
    } else {
      causeAnalysis = `임계값 **${threshold}**은 현실적인 수준이나, 해당 서비스가 최근 30일간 이 임계값을 초과하는 오류를 발생시키지 않았습니다. 서비스가 안정적으로 운영 중이거나, 검출 대상 서비스 명세가 변경되었을 수 있습니다.`;
      suggestion = `- 서비스 경로(svc_nm/op_nm)가 현행 시스템과 일치하는지 확인\n- 동일 서비스의 다른 알람 조건과 중복 여부 검토\n- 임계값이 적절한 경우 **정상 운영 중**으로 판단하고 현행 유지`;
    }
  } else if (detectType === 'RPY_TIME') {
    causeAnalysis = `응답시간 기반 알람으로, 임계값 **${threshold}**을 30일간 초과한 적이 없습니다. 해당 서비스의 응답시간이 지속적으로 양호하거나, 검출 대상 서비스 경로의 트래픽이 매우 낮아 샘플 수 부족으로 평균값이 임계에 도달하지 않을 수 있습니다.`;
    suggestion = `- 해당 서비스 경로의 **최대 응답시간(max_rpy_time)** 실제 값 확인\n- 평균 응답시간이 임계의 50% 이하라면 임계값은 적절 → 현행 유지\n- 임계값이 과도하게 높으면 **(${Math.round(thrsNum * 0.5)}ms 수준**으로 하향 검토`;
  } else if (detectType === 'ERR_RATE') {
    causeAnalysis = `오류율 기반 알람으로, 임계값 **${threshold}**을 30일간 초과한 적이 없습니다. 해당 서비스의 오류율이 임계 미만으로 양호하게 유지되고 있습니다.`;
    suggestion = `- 최근 실제 오류율 평균이 임계의 50% 이하라면 정상 운영 중\n- **오류율이 지속 0%라면** 검출 대상 서비스 경로 활성 여부 재확인 필요`;
  } else if (detectType === 'CALL_CASCNT') {
    causeAnalysis = `호출건수 기반 알람으로, 30일간 설정 임계(**${threshold}**)에 도달한 적이 없습니다. 해당 서비스의 실제 호출량이 임계값보다 낮거나, 검출 주기(${term}) 내 누적 호출이 충분하지 않을 수 있습니다.`;
    suggestion = `- 실제 ${term} 호출건수 평균 확인 후 임계값 재산정\n- 호출 자체가 극히 드문 기능이라면 **DAY1(1일 단위)** 검출 주기로 변경 검토`;
  }

  if (level === 'Critical') {
    riskNote = `\n\n⚠️ **주의:** 이 알람은 **Critical** 등급으로 설정되어 있습니다. 30일간 미발생이더라도 실제 장애 발생 시 탐지가 되어야 하므로, 임계값이 너무 높게 설정된 경우 **탐지 누락 위험**이 있습니다. 반드시 현행 임계값의 적절성을 검토하세요.`;
  }

  return [
    `## ${service} — ${alarmNm}`,
    `\n**30일 미발생 원인 추정**\n\n${causeAnalysis}`,
    `\n**개선 방안**\n\n${suggestion}`,
    riskNote,
  ].join('\n');
}

function getMockData(
  serviceName: string,
  method: string,
  url: string,
  config: InternalAxiosRequestConfig
): unknown {
  // ── Dashboard ────────────────────────────────────────────
  if (serviceName === 'dashboard') {
    if (method === 'get' && url === '/dashboard/summary')
      return getMockDashboardSummary(Number(config.params?.days ?? 7));
    if (method === 'get' && url === '/dashboard/hourly-trend') return MOCK_HOURLY_TREND;
    if (method === 'get' && url === '/dashboard/widgets') return MOCK_WIDGETS;
    if (method === 'get' && url === '/dashboard/service-statuses') return MOCK_SERVICE_STATUSES;
    if (method === 'get' && url === '/dashboard/alarm-conditions') return MOCK_ALARM_CONDITIONS;

    if (method === 'get' && url.startsWith('/dashboard/metrics/')) {
      const serviceId = url.replace('/dashboard/metrics/', '').split('?')[0];
      const metricType = String(config.params?.metricType ?? '');
      return MOCK_METRICS[serviceId]?.[metricType] ?? {
        serviceId, metricType, value: Math.round(Math.random() * 100),
        unit: '%', trend: 0,
        chartData: Array.from({ length: 20 }, (_, i) => ({
          time: new Date(Date.now() - (20 - i) * 60_000).toISOString(),
          value: Math.round(Math.random() * 100),
        })),
        updatedAt: new Date().toISOString(),
      };
    }
    if (method === 'post' && url === '/dashboard/widgets') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
      return { id: `w-${Date.now()}`, ...body, order: 99 };
    }
    if (method === 'delete' || method === 'put') return {};
  }

  // ── Incidents ────────────────────────────────────────────
  if (serviceName === 'incident') {
    if (method === 'get' && url === '/incidents') {
      const { severity, status, search, service_id } = config.params ?? {};
      const keyword = (search ?? '').toLowerCase().trim();
      const filtered = MOCK_INCIDENTS.incidents.filter((i) =>
        (!severity || i.severity === severity) &&
        (!status   || i.status   === status) &&
        (!service_id || i.serviceId === service_id) &&
        (!keyword  || i.alarmName.toLowerCase().includes(keyword) || i.serviceName.toLowerCase().includes(keyword))
      );
      return { ...MOCK_INCIDENTS, incidents: filtered, totalElements: filtered.length };
    }
    if (method === 'get' && url === '/incidents/critical/latest') return MOCK_CRITICAL_CHECK;
    if (method === 'patch' && url.endsWith('/ack'))     return { success: true };
    if (method === 'patch' && url.endsWith('/mute'))    return { success: true };
    if (method === 'patch' && url.endsWith('/resolve')) return { success: true };
    if (method === 'post') return {};
  }

  // ── AI ───────────────────────────────────────────────────
  if (serviceName === 'ai') {
    if (method === 'get' && url.endsWith('/analysis')) {
      const incidentId = url.split('/ai/incidents/')[1]?.split('/')[0] ?? '';
      return MOCK_AI_ANALYSIS[incidentId] ?? {
        incidentId, status: 'completed', progress: 100,
        result: {
          whatChanged: ['메트릭 값이 기준치를 초과했습니다.'],
          whyHappened: [{ cause: '분석 데이터 없음 (임시 모드)', confidence: 0.5 }],
          similarCases: [],
          recommendedActions: ['백엔드 연동 후 상세 분석을 확인하세요.'],
        },
      };
    }
    if (method === 'post') return {};
  }

  // ── Chat ─────────────────────────────────────────────────
  if (serviceName === 'chat') {
    if (method === 'get' && url === '/chat/history') return MOCK_CHAT_HISTORY;
    if (method === 'post' && url === '/chat/query') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
      const q = (body.query ?? '').toLowerCase();
      const alarmHstSeq = body.alarm_hst_seq;
      let summary = '';

      // 알람 조건 AI 분석: [알람조건분석] 접두어
      if ((body.query ?? '').startsWith('[알람조건분석]')) {
        summary = generateAlarmCondAnalysis(body.query ?? '');
      // 카드 채팅: alarm_hst_seq가 있으면 해당 알람 컨텍스트 기반 응답
      } else if (alarmHstSeq) {
        const alarmContextMap: Record<string, { alarmName: string; serviceName: string; thrs: number; thrsValue: number; detectType: string }> = {
          '11769': { alarmName: '요금온라인 전체 서비스 시스템오류 10분간 30건 이상 발생', serviceName: 'KOS-요금온라인', thrs: 30, thrsValue: 329415, detectType: 'CALL_CASCNT' },
          '12001': { alarmName: 'KOS 모바일 신규개통 시스템오류', serviceName: 'KOS-무선오더', thrs: 50, thrsValue: 127, detectType: 'ERR_S' },
          '8820':  { alarmName: '대리점 조회 오류', serviceName: 'KOS-물류', thrs: 30, thrsValue: 85, detectType: 'ERR_S' },
          '12015': { alarmName: 'KOS 무선오더 해지 시스템 오류', serviceName: 'KOS-무선오더', thrs: 50, thrsValue: 73, detectType: 'ERR_S' },
        };
        const ctx = alarmContextMap[String(alarmHstSeq)];
        const ctxName = ctx ? `${ctx.serviceName} · ${ctx.alarmName}` : `알람 #${alarmHstSeq}`;
        const ctxDetail = ctx
          ? `임계값 **${ctx.thrs}건** 대비 실제값 **${ctx.thrsValue.toLocaleString()}건** (${ctx.detectType})`
          : '';

        if (q.includes('원인') || q.includes('왜') || q.includes('이유')) {
          summary = `## ${ctxName} — 원인 분석\n\n${ctxDetail}\n\n**주요 원인:**\n1. 트래픽 급증으로 인한 임계값 초과 (임계 대비 **${ctx ? Math.round(ctx.thrsValue / ctx.thrs) : '?'}배** 발생)\n2. 동일 시간대 연관 서비스의 오류 연쇄 발생\n3. 배치 작업 또는 외부 시스템 지연으로 인한 처리 적체\n\n최근 20건 이력 기준으로 동일 패턴이 **주로 오전 9시~10시** 업무 피크 타임에 집중됩니다.`;
        } else if (q.includes('반복') || q.includes('패턴') || q.includes('이력')) {
          summary = `## ${ctxName} — 발생 패턴\n\n${ctxDetail}\n\n**이력 분석 (최근 20건):**\n- 총 발생: 20건\n- 자동 해소율: **25%** (5건)\n- 평균 지속 시간: 약 12분\n- 피크 시간대: **오전 9~10시**, **오후 2~3시**\n- 최근 추세: **증가 추세** ↑\n\n동일 alarm_id 기준으로 지난 30일 내 반복 발생 중입니다. 임계값 재검토를 권장합니다.`;
        } else if (q.includes('조치') || q.includes('해결') || q.includes('방법')) {
          summary = `## ${ctxName} — 권장 조치\n\n${ctxDetail}\n\n**즉시 조치:**\n1. 해당 서비스의 앱 서버 로그 확인 (NBSS 계열 앱)\n2. 연관 서비스 오류율 동시 확인\n3. DB 커넥션 풀 상태 점검\n\n**중기 조치:**\n- 임계값 상향 검토 (현재 ${ctx?.thrs ?? '?'}건 → 트래픽 패턴 기반 재산정)\n- 피크 타임 자동 스케일 아웃 정책 적용\n\n**모니터링 포인트:**\n- clear_yn 전환 여부 지속 확인\n- 연관 Critical 알람 동시 발생 여부`;
        } else if (q.includes('임계') || q.includes('threshold')) {
          summary = `## ${ctxName} — 임계값 분석\n\n현재 임계값: **${ctx?.thrs ?? '?'}건**\n실제 발생값: **${ctx?.thrsValue.toLocaleString() ?? '?'}건**\n\n임계값 대비 **${ctx ? Math.round(ctx.thrsValue / ctx.thrs) : '?'}배** 수준으로 과도하게 초과하고 있습니다.\n\n**권장 임계값 조정 방향:**\n- 최근 30일 평균 트래픽 분석 후 95 퍼센타일 기준으로 설정\n- 피크 시간대와 비피크 시간대 구분 적용 고려\n- 경보 피로(Alert Fatigue) 방지를 위해 MIN5 → MIN10으로 검출 주기 조정 검토`;
        } else {
          summary = `## ${ctxName}\n\n${ctxDetail}\n\n이 알람에 대해 더 구체적으로 질문해주세요.\n\n**가능한 질문 예시:**\n- "이 알람이 반복되는 원인은 무엇인가요?"\n- "발생 패턴이 어떻게 되나요?"\n- "임계값 조정이 필요한가요?"\n- "권장 조치 방법이 있나요?"`;
        }
      } else if (q.includes('요금') || q.includes('bg008802')) {
        summary = `**KOS-요금온라인(BG008802) 현황**\n\n| 메트릭 | 현재값 | 추이 |\n|--------|--------|------|\n| 트랜잭션 | 10,247 req/min | +3.2% ↑ |\n| 에러율 | 0.32% | +1.8% ↑ |\n| 응답시간 | 1,423ms | -2.1% ↓ |\n\n현재 alarm_id=46 관련 Critical 인시던트 1건 Open 상태입니다. 임계값(30건)이 실 트래픽 대비 과소 설정되어 있어 상향 조정을 권장합니다.`;
      } else if (q.includes('무선') || q.includes('bg011701')) {
        summary = `**KOS-무선오더(BG011701) 현황**\n\n분당 트랜잭션 10,841건, 에러율 0.05%로 정상 범위입니다.\n\n단, 현재 Critical 인시던트 2건 발생 중:\n- 모바일 신규개통 오류 (127건/5분, 임계 50건)\n- 해지 시스템 오류 (73건/5분, 임계 50건)\n\nNBSS_ORD 앱 서버 상태 확인이 필요합니다.`;
      } else if (q.includes('critical') || q.includes('긴급') || q.includes('위험')) {
        summary = `**현재 Critical 인시던트 4건:**\n1. KOS-요금온라인 — 시스템오류 329,415건 (Open)\n2. KOS-무선오더 — 신규개통 오류 127건 (Open)\n3. KOS-물류 — 대리점 조회 오류 85건 (ACK)\n4. KOS-무선오더 — 해지 오류 73건 (Open)\n\n가장 긴급한 항목은 inc-002(무선오더 신규개통)로, 3분 전 발생하여 아직 미대응 상태입니다.`;
      } else if (q.includes('에러') || q.includes('오류')) {
        summary = `**서비스별 에러율 현황:**\n\n| 서비스 | 에러율 | 상태 |\n|--------|--------|------|\n| KOS-B2C CRM | 3.42% | ⚠️ 상승 |\n| KOS-유선공통 | 2.19% | ⚠️ 상승 |\n| KOS-요금온라인 | 0.32% | 정상 |\n| KOS-물류 | 0.08% | 정상 |\n| KOS-무선오더 | 0.05% | 정상 |\n| KOS-통합고객 | 0.02% | 정상 |\n\nKOS-B2C CRM 에러율이 3.42%로 가장 높으며, NBSS_SMS 오류율 알람(임계 10%)도 발생 중입니다.`;
      } else {
        summary = `**"${body.query ?? ''}"**에 대한 분석입니다.\n\n현재 시스템 전체 현황:\n- 총 인시던트: 12건 (Critical 4, Warning 4, Info 4)\n- 미해결: 8건\n- 평균 응답시간: 정상 범위\n\n구체적인 서비스명이나 메트릭을 지정하시면 상세 분석을 제공합니다.\n\n예시: "KOS-요금온라인 트래픽 추이", "Critical 인시던트 현황", "에러율 높은 서비스"`;
      }

      return {
        queryId: `q-${Date.now()}`,
        query: body.query ?? '',
        answer: { summary },
        createdAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

export function applyMockInterceptor(client: AxiosInstance, serviceName: string) {
  // Axios 커스텀 어댑터: HTTP 요청을 Mock 데이터로 대체
  client.defaults.adapter = async (config) => {
    await delay(150 + Math.random() * 200);

    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();
    const data = getMockData(serviceName, method, url, config);

    if (data !== null) {
      return makeAxiosResponse(data, config);
    }

    // 매핑되지 않은 URL 처리
    const err = new Error(`[Mock] 미처리 요청: ${method.toUpperCase()} ${url}`);
    console.warn(err.message);
    return makeAxiosResponse({}, config);
  };
}
