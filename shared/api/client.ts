/**
 * @file client.ts
 * @description Axios 기반 API 클라이언트 팩토리 (인터셉터 포함)
 * @module shared/api
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { API_CONFIG, isMockMode } from '@/shared/api/config';
import { applyMockInterceptor } from '@/shared/api/mock/interceptor';

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

function createClient(baseURL: string, serviceName: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  // 요청 인터셉터: JWT 자동 첨부 (인증 구현 시 활성화)
  // client.interceptors.request.use((config) => {
  //   const token = getToken();
  //   if (token) {
  //     config.headers.Authorization = `Bearer ${token}`;
  //   }
  //   return config;
  // });

  // Mock 모드: 더미 데이터 인터셉터 (runtime-env.js 또는 빌드시 env 기반)
  if (isMockMode()) {
    applyMockInterceptor(client, serviceName);
  }

  // 응답 인터셉터: 에러 처리 (401 → 로그인)
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const authClient = () => createClient(API_CONFIG.AUTH_URL, 'auth');
export const dashboardClient = () => createClient(API_CONFIG.DASHBOARD_URL, 'dashboard');
export const incidentClient = () => createClient(API_CONFIG.INCIDENT_URL, 'incident');
export const aiClient = () => createClient(API_CONFIG.AI_URL, 'ai');
export const chatClient = () => createClient(API_CONFIG.CHAT_URL, 'chat');
