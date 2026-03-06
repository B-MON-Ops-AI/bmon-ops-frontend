/**
 * @file ai.api.ts
 * @description AI 분석 API 클라이언트
 * @module features/incidents/api
 */
import { aiClient } from '@/shared/api';
import type { AIAnalysis } from '@/entities/incident';

export const aiApi = {
  requestAnalysis: (incidentId: string) =>
    aiClient().post(`/incidents/${incidentId}/analyze`, {}).then((r) => r.data),

  getAnalysis: (incidentId: string) =>
    aiClient().get<AIAnalysis>(`/incidents/${incidentId}/analysis`).then((r) => r.data),

  /** 인시던트 해결 보고서 초안 생성 요청 */
  generateResolutionDraft: (incidentId: string, context?: string) =>
    aiClient().post<{ draft: string }>(`/incidents/${incidentId}/resolution-draft`, { context }).then((r) => r.data),
};
