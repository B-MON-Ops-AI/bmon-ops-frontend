/**
 * @file types.ts
 * @description 설정 관련 타입 정의
 * @module entities/settings
 */
import type { UserRole } from '@/entities/auth';

export interface Threshold {
  serviceId: string;
  serviceName: string;
  errorRate: number;
  responseTime: number;
  traffic: number;
}

export interface NotificationSettings {
  slackWebhookUrl: string;
  receivers: {
    critical: string[];
    warning: string[];
    info: string[];
  };
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserListResponse {
  users: UserAccount[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface CreateUserRequest {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
}
