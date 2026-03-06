/**
 * @file incident.api.ts
 * @description 인시던트 API (페이징 지원)
 */
import { incidentClient } from '@/shared/api';
import type { Incident } from '@/entities/incident';

export interface IncidentListResponse {
  incidents: Incident[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const incidentApi = {
  getIncidents: (params: { severity?: string; status?: string; page?: number; size?: number }) =>
    incidentClient().get<IncidentListResponse>('/incidents', { params }).then((r) => r.data),

  ackIncident: (id: string) =>
    incidentClient().post(`/incidents/${id}/ack`, {}).then((r) => r.data),

  muteIncident: (id: string, minutes: number) =>
    incidentClient().post(`/incidents/${id}/mute`, { minutes }).then((r) => r.data),

  resolveIncident: (id: string, resolution: string) =>
    incidentClient().post(`/incidents/${id}/resolve`, { resolution }).then((r) => r.data),
};
