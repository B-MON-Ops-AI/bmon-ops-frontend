/**
 * @file settings.api.ts
 * @description 설정 API 클라이언트 (임계값, 알림, 사용자)
 * @module features/settings/api
 */
import { settingsClient } from '@/shared/api';
import type { Threshold, NotificationSettings, UserListResponse, UserAccount, CreateUserRequest, UpdateUserRequest } from '@/entities/settings';

export const settingsApi = {
  // ── 임계값 ──
  getThresholds: () =>
    settingsClient().get<{ thresholds: Threshold[] }>('/settings/thresholds').then((r) => r.data),

  updateThreshold: (serviceId: string, data: Omit<Threshold, 'serviceId' | 'serviceName'>) =>
    settingsClient().put(`/settings/thresholds/${serviceId}`, data).then((r) => r.data),

  // ── 알림 ──
  getNotifications: () =>
    settingsClient().get<NotificationSettings>('/settings/notifications').then((r) => r.data),

  updateNotifications: (data: NotificationSettings) =>
    settingsClient().put('/settings/notifications', data).then((r) => r.data),

  testNotification: () =>
    settingsClient().post('/settings/notifications/test', {}).then((r) => r.data),

  // ── 사용자 ──
  getUsers: (page = 0, size = 10) =>
    settingsClient()
      .get<UserListResponse>('/settings/users', { params: { page, size } })
      .then((r) => r.data),

  createUser: (data: CreateUserRequest) =>
    settingsClient().post<UserAccount>('/settings/users', data).then((r) => r.data),

  updateUser: (userId: string, data: UpdateUserRequest) =>
    settingsClient().put<UserAccount>(`/settings/users/${userId}`, data).then((r) => r.data),

  deactivateUser: (userId: string) =>
    settingsClient().patch(`/settings/users/${userId}/deactivate`, {}).then((r) => r.data),
};
