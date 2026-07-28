import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alarmConditionsApi } from '../api/alarmConditions.api';
import type { UpdateAlarmConditionRequest } from '@/entities/alarm-condition';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 30_000);

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
