/**
 * @file ai.api.ts
 * @description AI 분석 API 클라이언트 (분석 요청, 결과 조회)
 * @module features/incidents/api
 */
import { aiClient } from '@/shared/api';
import type { AIAnalysis } from '@/entities/incident';

export const aiApi = {
  requestAnalysis: (incidentId: string) =>
    aiClient().post(`/ai/incidents/${incidentId}/analyze`, {}).then((r) => r.data),

  getAnalysis: (incidentId: string) =>
    aiClient().get<AIAnalysis>(`/ai/incidents/${incidentId}/analysis`).then((r) => r.data),
};
