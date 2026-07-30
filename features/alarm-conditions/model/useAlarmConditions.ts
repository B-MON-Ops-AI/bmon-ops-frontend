import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alarmConditionsApi } from '../api/alarmConditions.api';
import type { UpdateAlarmConditionRequest, CreateAlarmConditionRequest } from '@/entities/alarm-condition';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 30_000);
const GAP_POLLING = 5 * 60_000; // 공백 제안은 통계 기반이라 5분 주기

export function useAlarmConditions() {
  return useQuery({
    queryKey: ['alarm-conditions'],
    queryFn: () => alarmConditionsApi.getAll(),
    refetchInterval: POLLING,
  });
}

export function useUpdateAlarmCondition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alarmId, data }: { alarmId: string; data: UpdateAlarmConditionRequest }) =>
      alarmConditionsApi.updateCondition(alarmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alarm-conditions'] }),
  });
}

// AI 알람 공백 제안 목록
export function useAlarmGaps() {
  return useQuery({
    queryKey: ['alarm-gaps'],
    queryFn: () => alarmConditionsApi.getGaps(),
    refetchInterval: GAP_POLLING,
  });
}

// 공백 제안 승인 → 신규 등록
export function useCreateAlarmCondition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlarmConditionRequest) => alarmConditionsApi.createCondition(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alarm-gaps'] });
      qc.invalidateQueries({ queryKey: ['alarm-conditions'] });
    },
  });
}
