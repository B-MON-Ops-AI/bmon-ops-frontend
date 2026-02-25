/**
 * @file config.ts
 * @description API 엔드포인트 설정 및 런타임 환경변수 관리
 * @module shared/api
 */
type RuntimeConfig = {
  API_GROUP: string;
  AUTH_HOST: string;
  DASHBOARD_HOST: string;
  INCIDENT_HOST: string;
  AI_HOST: string;
  CHAT_HOST: string;
  SETTINGS_HOST: string;
};

declare global {
  interface Window {
    __runtime_config__?: RuntimeConfig;
  }
}

function getConfig(): RuntimeConfig {
  if (typeof window !== 'undefined' && window.__runtime_config__) {
    return window.__runtime_config__;
  }
  return {
    API_GROUP: process.env.NEXT_PUBLIC_API_GROUP ?? '/api/v1',
    AUTH_HOST: process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:8081',
    DASHBOARD_HOST: process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? 'http://localhost:8082',
    INCIDENT_HOST: process.env.NEXT_PUBLIC_INCIDENT_API_URL ?? 'http://localhost:8083',
    AI_HOST: process.env.NEXT_PUBLIC_AI_API_URL ?? 'http://localhost:8084',
    CHAT_HOST: process.env.NEXT_PUBLIC_CHAT_API_URL ?? 'http://localhost:8085',
    SETTINGS_HOST: process.env.NEXT_PUBLIC_SETTINGS_API_URL ?? 'http://localhost:8086',
  };
}

export const API_CONFIG = {
  get AUTH_URL() { return `${getConfig().AUTH_HOST}${getConfig().API_GROUP}`; },
  get DASHBOARD_URL() { return `${getConfig().DASHBOARD_HOST}${getConfig().API_GROUP}`; },
  get INCIDENT_URL() { return `${getConfig().INCIDENT_HOST}${getConfig().API_GROUP}`; },
  get AI_URL() { return `${getConfig().AI_HOST}${getConfig().API_GROUP}`; },
  get CHAT_URL() { return `${getConfig().CHAT_HOST}${getConfig().API_GROUP}`; },
  get SETTINGS_URL() { return `${getConfig().SETTINGS_HOST}${getConfig().API_GROUP}`; },
  TIMEOUT: 30000,
};
