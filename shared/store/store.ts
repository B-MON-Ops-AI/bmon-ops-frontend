/**
 * @file store.ts
 * @description Redux 스토어 설정 및 타입 정의
 * @module shared/store
 */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from '@/features/auth/model/authSlice';
import uiReducer from '@/shared/store/slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
