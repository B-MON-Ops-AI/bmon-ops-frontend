/**
 * @file auth.api.ts
 * @description 인증 API 클라이언트 (로그인, 로그아웃)
 * @module features/auth/api
 */
import { authClient } from '@/shared/api';
import type { LoginRequest, LoginResponse } from '@/entities/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    authClient().post<LoginResponse>('/auth/login', data).then((r) => r.data),

  logout: () =>
    authClient().post('/auth/logout').then((r) => r.data),
};
