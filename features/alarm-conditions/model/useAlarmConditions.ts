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

// 제안 근거 데이터 (기준일 시간대별 실측 + baseline) — 다이얼로그 열릴 때만 조회
export function useAlarmGapEvidence(
  params: { svcNm: string; opNm: string; domnId: string; detectType: string } | null,
) {
  return useQuery({
    queryKey: ['alarm-gap-evidence', params],
    queryFn: () => alarmConditionsApi.getGapEvidence(params!),
    enabled: !!params,
  });
}

// 제안 1건 LLM 인사이트 — 근거 다이얼로그 열릴 때만 (온디맨드, 서버·클라 캐시)
export function useProposalInsight(
  params: { svcNm: string; opNm: string; domnId: string; detectType: string; thrs: number; comprType: string } | null,
) {
  return useQuery({
    queryKey: ['proposal-insight', params],
    queryFn: () => alarmConditionsApi.getProposalInsight(params!),
    enabled: !!params,
    staleTime: Infinity,
  });
}

// 제안 목록 교차 해석 — 버튼 클릭 시(enabled)만 (온디맨드)
export function useProposalsOverview(enabled: boolean) {
  return useQuery({
    queryKey: ['proposals-overview'],
    queryFn: () => alarmConditionsApi.getProposalsOverview(),
    enabled,
    staleTime: 5 * 60_000,
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
