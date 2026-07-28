/**
 * @file client.ts
 * @description Axios 기반 API 클라이언트 팩토리 (실 백엔드 호출)
 * @module shared/api
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { API_CONFIG } from '@/shared/api/config';

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  // 응답 인터셉터: 에러 전파 (인증은 사내 통합 계정(SSO)으로 처리 — 앱 내 로그인 라우트 없음)
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(error)
  );

  return client;
}

export const dashboardClient = () => createClient(API_CONFIG.DASHBOARD_URL);
export const incidentClient = () => createClient(API_CONFIG.INCIDENT_URL);
export const aiClient = () => createClient(API_CONFIG.AI_URL);
export const chatClient = () => createClient(API_CONFIG.CHAT_URL);
