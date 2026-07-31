import { dashboardClient } from '@/shared/api';
import type {
  AlarmConditionListResponse,
  UpdateAlarmConditionRequest,
  AlarmGapResponse,
  AlarmGapEvidence,
  AlarmProposalInsight,
  AlarmProposalsOverview,
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

  // 제안 근거 데이터 → GET /api/v1/alarm-conditions/gaps/evidence
  getGapEvidence: (params: { svcNm: string; opNm: string; domnId: string; detectType: string }) =>
    dashboardClient()
      .get<AlarmGapEvidence>('/alarm-conditions/gaps/evidence', { params })
      .then((r) => r.data),

  // 제안 1건 LLM 인사이트 → GET /api/v1/ai/alarm-insights/proposal
  getProposalInsight: (params: {
    svcNm: string; opNm: string; domnId: string; detectType: string; thrs: number; comprType: string;
  }) =>
    dashboardClient()
      .get<AlarmProposalInsight>('/ai/alarm-insights/proposal', { params })
      .then((r) => r.data),

  // 제안 목록 교차 해석 → GET /api/v1/ai/alarm-insights/overview
  getProposalsOverview: (top = 30) =>
    dashboardClient()
      .get<AlarmProposalsOverview>('/ai/alarm-insights/overview', { params: { top } })
      .then((r) => r.data),

  // 공백 제안 승인 → POST /api/v1/alarm-conditions (신규 등록)
  createCondition: (data: CreateAlarmConditionRequest) =>
    dashboardClient()
      .post<{ success: boolean; alarmId: string }>('/alarm-conditions', data)
      .then((r) => r.data),
};
