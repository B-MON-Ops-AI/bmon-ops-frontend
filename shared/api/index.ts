/**
 * @file index.ts
 * @description 공유 API 클라이언트 공개 API
 * @module shared/api
 */
export { authClient, dashboardClient, incidentClient, aiClient, chatClient, settingsClient } from './client';
export { API_CONFIG } from './config';
