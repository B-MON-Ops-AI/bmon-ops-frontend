/**
 * @file interceptor.ts
 * @description Axios Mock 인터셉터 (개발 환경 전용)
 * @module shared/api/mock
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  MOCK_WIDGETS, MOCK_METRICS, MOCK_INCIDENTS, MOCK_CRITICAL_CHECK,
  MOCK_AI_ANALYSIS, MOCK_CHAT_HISTORY, MOCK_THRESHOLDS,
  MOCK_NOTIFICATIONS, MOCK_USERS,
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
      const { severity, status } = config.params ?? {};
      return {
        ...MOCK_INCIDENTS,
        incidents: MOCK_INCIDENTS.incidents.filter((i) =>
          (!severity || i.severity === severity) &&
          (!status || i.status === status)
        ),
      };
    }
    if (method === 'get' && url === '/incidents/critical/latest') return MOCK_CRITICAL_CHECK;
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
      return {
        queryId: `q-${Date.now()}`,
        query: body.query ?? '',
        answer: {
          summary: `**[Mock 응답]** "${body.query ?? ''}"에 대한 답변입니다.\n\n현재 모의 데이터 모드로 동작 중입니다. 백엔드 연동 후 실제 AI 응답을 받을 수 있습니다.`,
        },
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
