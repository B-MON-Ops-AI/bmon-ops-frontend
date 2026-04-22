/**
 * @file interceptor.ts
 * @description Axios Mock 인터셉터 (개발 환경 전용)
 * @module shared/api/mock
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  MOCK_WIDGETS, MOCK_METRICS, MOCK_INCIDENTS, MOCK_CRITICAL_CHECK,
  MOCK_AI_ANALYSIS, MOCK_CHAT_HISTORY, MOCK_THRESHOLDS,
  MOCK_NOTIFICATIONS, MOCK_USERS, getMockDashboardSummary, MOCK_HOURLY_TREND,
} from '@/shared/api/mock/data';

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeAxiosResponse(data: unknown, config: InternalAxiosRequestConfig) {
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
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
      let summary = '';

      if (q.includes('요금') || q.includes('bg008802')) {
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

  // ── Settings ─────────────────────────────────────────────
  if (serviceName === 'settings') {
    if (method === 'get' && url === '/settings/thresholds') return MOCK_THRESHOLDS;
    if (method === 'get' && url === '/settings/notifications') return MOCK_NOTIFICATIONS;
    if (method === 'get' && url === '/settings/users') return MOCK_USERS;
    if (method === 'post' || method === 'put' || method === 'patch') return {};
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
