/**
 * @file types.ts
 * @description 인증 관련 타입 정의
 * @module entities/auth
 */
export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isRestored: boolean;
}
