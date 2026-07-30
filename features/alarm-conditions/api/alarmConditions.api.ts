import { dashboardClient } from '@/shared/api';
import type {
  AlarmConditionListResponse,
  UpdateAlarmConditionRequest,
  AlarmGapResponse,
  CreateAlarmConditionRequest,
} from '@/entities/alarm-condition';

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

  // AI 알람 공백 제안 → GET /api/v1/alarm-conditions/gaps
  getGaps: (top = 30) =>
    dashboardClient()
      .get<AlarmGapResponse>('/alarm-conditions/gaps', { params: { top } })
      .then((r) => r.data),

  // 공백 제안 승인 → POST /api/v1/alarm-conditions (신규 등록)
  createCondition: (data: CreateAlarmConditionRequest) =>
    dashboardClient()
      .post<{ success: boolean; alarmId: string }>('/alarm-conditions', data)
      .then((r) => r.data),
};
