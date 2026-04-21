/**
 * @file incident.api.ts
 * @description 인시던트 API 클라이언트 (조회, 확인, 음소거, 해결)
 * @module features/incidents/api
 */
import { incidentClient } from '@/shared/api';
import type { IncidentListResponse, CriticalCheckResponse } from '@/entities/incident';

export const incidentApi = {
  getIncidents: (params?: {
    severity?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    service_id?: string;
    page?: number;
    size?: number;
  }) =>
    incidentClient()
      .get<IncidentListResponse>('/incidents', { params })
      .then((r) => r.data),

  getCriticalLatest: (since?: string) =>
    incidentClient()
      .get<CriticalCheckResponse>('/incidents/critical/latest', { params: { since } })
      .then((r) => r.data),

  ackIncident: (incidentId: string) =>
    incidentClient().patch(`/incidents/${incidentId}/ack`, {}).then((r) => r.data),

  muteIncident: (incidentId: string, muteDurationMinutes: number) =>
    incidentClient()
      .patch(`/incidents/${incidentId}/mute`, { muteDurationMinutes })
      .then((r) => r.data),

  resolveIncident: (incidentId: string, resolution: string) =>
    incidentClient()
      .patch(`/incidents/${incidentId}/resolve`, { resolution })
      .then((r) => r.data),
};
