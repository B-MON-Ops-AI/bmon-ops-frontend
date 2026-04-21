/**
 * @file useIncidents.ts
 * @description 인시던트 데이터 조회·처리 커스텀 훅
 * @module features/incidents/model
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi } from '@/features/incidents/api/incident.api';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 30_000);

export function useIncidents(params?: { severity?: string; status?: string; from_date?: string; to_date?: string; search?: string; service_id?: string; page?: number }) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => incidentApi.getIncidents(params),
    refetchInterval: POLLING,
  });
}

export function useCriticalCheck(since?: string) {
  return useQuery({
    queryKey: ['incidents', 'critical', since],
    queryFn: () => incidentApi.getCriticalLatest(since),
    refetchInterval: POLLING,
  });
}

export function useAckIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (incidentId: string) => incidentApi.ackIncident(incidentId),
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
