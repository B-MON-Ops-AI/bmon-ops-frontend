import { dashboardClient } from '@/shared/api';
import type { AlarmConditionListResponse } from '@/entities/alarm-condition';

export const alarmConditionsApi = {
  getAll: () =>
    dashboardClient()
      .get<AlarmConditionListResponse>('/dashboard/alarm-conditions')
      .then((r) => r.data),
};
