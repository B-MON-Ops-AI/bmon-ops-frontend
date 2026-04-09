'use client';

/**
 * @file AuthGuard.tsx
 * @description 인증 상태 기반 라우트 보호 컴포넌트
 * @module features/auth/ui
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAppSelector, useAppDispatch } from '@/shared/store';
import { restoreAuth } from '@/features/auth/model/authSlice';

const PUBLIC_PATHS = ['/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // TODO: 인증 구현 시 활성화
  return <>{children}</>;
}
