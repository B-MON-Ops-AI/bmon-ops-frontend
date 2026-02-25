/**
 * @file useAI.ts
 * @description AI 분석 요청·조회 커스텀 훅
 * @module features/incidents/model
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/features/incidents/api/ai.api';

const AI_POLLING = Number(process.env.NEXT_PUBLIC_AI_POLLING_INTERVAL ?? 5_000);

export function useAIAnalysis(incidentId: string | null) {
  return useQuery({
    queryKey: ['ai-analysis', incidentId],
    queryFn: () => aiApi.getAnalysis(incidentId!),
    enabled: !!incidentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return AI_POLLING;
      if (data.status === 'completed' || data.status === 'failed') return false;
      return AI_POLLING;
    },
  });
}

export function useRequestAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (incidentId: string) => aiApi.requestAnalysis(incidentId),
    onSuccess: (_data, incidentId) => {
      qc.invalidateQueries({ queryKey: ['ai-analysis', incidentId] });
    },
  });
}
