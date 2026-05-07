/**
 * @file useSettings.ts
 * @description 설정 데이터 조회·변경 커스텀 훅
 * @module features/settings/model
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/features/settings/api/settings.api';
import type { Threshold, NotificationSettings, CreateUserRequest, UpdateUserRequest } from '@/entities/settings';

export function useThresholds() {
  return useQuery({
    queryKey: ['thresholds'],
    queryFn: () => settingsApi.getThresholds(),
  });
}

export function useUpdateThreshold() {
  const qc = useQueryClient();
  type UpdateData = Omit<Threshold, 'serviceId' | 'serviceName'>;
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: UpdateData }) =>
      settingsApi.updateThreshold(serviceId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thresholds'] }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => settingsApi.getNotifications(),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NotificationSettings) => settingsApi.updateNotifications(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: () => settingsApi.testNotification(),
  });
}

export function useUsers(page = 0, size = 10) {
  return useQuery({
    queryKey: ['users', page, size],
    queryFn: () => settingsApi.getUsers(page, size),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => settingsApi.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) =>
      settingsApi.updateUser(userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => settingsApi.deactivateUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
