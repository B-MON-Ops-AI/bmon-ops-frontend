import { useQuery } from '@tanstack/react-query';
import { alarmConditionsApi } from '../api/alarmConditions.api';

const POLLING = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL ?? 30_000);

export function useAlarmConditions() {
  return useQuery({
    queryKey: ['alarm-conditions'],
    queryFn: () => alarmConditionsApi.getAll(),
    refetchInterval: POLLING,
  });
}
