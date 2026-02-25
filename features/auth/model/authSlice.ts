/**
 * @file authSlice.ts
 * @description 인증 상태 Redux 슬라이스 (로그인, 로그아웃, 세션 복원)
 * @module features/auth/model
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/entities/auth';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isRestored: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isRestored = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('userId', action.payload.user.id);
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isRestored = true;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
      }
    },
    restoreAuth(state) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            state.token = token;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
          } catch {
            // 세션 복원 실패: 기본 상태 유지
          }
        }
        state.isRestored = true;
      }
    },
  },
});

export const { setCredentials, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
