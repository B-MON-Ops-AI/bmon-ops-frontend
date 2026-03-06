/**
 * @file interceptor.ts
 * @description Axios Mock 인터셉터 (서버 사이드 페이징 로직 포함)
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  MOCK_WIDGETS, MOCK_METRICS, MOCK_INCIDENTS,
  MOCK_AI_ANALYSIS, MOCK_CHAT_HISTORY,
} from '@/shared/api/mock/data';

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeAxiosResponse(data: unknown, config: InternalAxiosRequestConfig) {
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
}

function generateAgentResponse(query: string): string {
  if (query.includes('과거') || query.includes('이력')) return `최근 30일 동안 총 4회 발생했습니다.`;
  return `분석 중입니다.`;
}

function getMockData(
  serviceName: string,
  method: string,
  url: string,
  config: InternalAxiosRequestConfig
): unknown {
  if (serviceName === 'incident') {
    if (url.includes('/incidents')) {
      const params = config.params ?? {};
      const page = parseInt(params.page ?? '0', 10);
      const size = parseInt(params.size ?? '10', 10);
      const severity = params.severity;
      const status = params.status;

      // 1. 필터링
      let filtered = MOCK_INCIDENTS.incidents.filter((i) =>
        (!severity || i.severity === severity) &&
        (!status || i.status === status)
      );

      // 2. 페이징 계산
      const totalElements = filtered.length;
      const totalPages = Math.ceil(totalElements / size);
      const start = page * size;
      const end = start + size;
      const content = filtered.slice(start, end);

      return {
        incidents: content,
        totalElements,
        totalPages,
        currentPage: page,
      };
    }
  }

  if (serviceName === 'ai') {
    if (url.includes('/analysis')) return MOCK_AI_ANALYSIS['inc-001'] || {};
    if (url.includes('/resolution-draft')) return { draft: '[원인]\n...\n[조치]\n...' };
  }

  if (serviceName === 'chat') {
    if (url.includes('/query')) {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return { answer: { summary: generateAgentResponse(body?.query || '') } };
    }
  }

  return null;
}

export function applyMockInterceptor(client: AxiosInstance, serviceName: string) {
  client.defaults.adapter = async (config) => {
    await delay(500);
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();
    const data = getMockData(serviceName, method, url, config);
    if (data !== null) return makeAxiosResponse(data, config);
    return makeAxiosResponse({}, config);
  };
}
