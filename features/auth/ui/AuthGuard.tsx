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
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token, isRestored } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isRestored) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!token && !isPublic) {
      router.replace('/login');
    }
  }, [isRestored, token, pathname, router]);

  if (!isRestored) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!token && !isPublic) return null;

  return <>{children}</>;
}
