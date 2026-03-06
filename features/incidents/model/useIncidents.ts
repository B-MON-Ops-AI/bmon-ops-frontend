/**
 * @file useIncidents.ts
 * @description 인시던트 데이터 조회 (Infinite Query 지원 및 기존 기능 복구)
 */
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi } from '@/features/incidents/api/incident.api';
import type { CriticalCheckResponse } from '@/entities/incident';

export function useIncidents(filters: { severity?: string; status?: string; size?: number }) {
  const pageSize = filters.size ?? 10;

  return useInfiniteQuery({
    queryKey: ['incidents', filters.severity, filters.status, pageSize],
    queryFn: ({ pageParam = 0 }) => 
      incidentApi.getIncidents({ ...filters, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages - 1) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
  });
}

/** 기존 복구: Critical 인시던트 발생 여부 체크 훅 */
export function useCriticalCheck() {
  return useQuery({
    queryKey: ['critical-check'],
    queryFn: async (): Promise<CriticalCheckResponse> => {
      const res = await incidentApi.getIncidents({ severity: 'critical', status: 'open', page: 0, size: 1 });
      return {
        hasCritical: res.totalElements > 0,
        criticalCount: res.totalElements,
        latestOccurredAt: res.incidents[0]?.occurredAt,
      };
    },
    refetchInterval: 10000, // 10초마다 체크
  });
}

export function useAckIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentApi.ackIncident(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });
}

export function useMuteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, minutes }: { incidentId: string; minutes: number }) =>
      incidentApi.muteIncident(incidentId, minutes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, resolution }: { incidentId: string; resolution: string }) =>
      incidentApi.resolveIncident(incidentId, resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });
}
