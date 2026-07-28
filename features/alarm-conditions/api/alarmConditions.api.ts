import { dashboardClient } from '@/shared/api';
import type { AlarmConditionListResponse, UpdateAlarmConditionRequest } from '@/entities/alarm-condition';

export const alarmConditionsApi = {
  getAll: () =>
    dashboardClient()
      .get<AlarmConditionListResponse>('/dashboard/alarm-conditions')
      .then((r) => r.data),

  // 임계값·검출주기·사용여부 수동 편집 → PATCH /api/v1/alarm-conditions/{alarmId}
  updateCondition: (alarmId: string, data: UpdateAlarmConditionRequest) =>
    dashboardClient()
      .patch(`/alarm-conditions/${alarmId}`, data)
      .then((r) => r.data),
};
