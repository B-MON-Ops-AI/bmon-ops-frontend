'use client';

/**
 * @file page.tsx
 * @description 로그인 페이지
 * @module app/login
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useMutation } from '@tanstack/react-query';
import { authApi, setCredentials } from '@/features/auth';
import { useAppDispatch, useAppSelector } from '@/shared/store';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  // TODO: 백엔드 연동 후 Mock 계정 제거
  const MOCK_ACCOUNT = { id: 'operator123', password: '1234' };

  const { mutate: login, isPending } = useMutation({
    mutationFn: () => {
      if (id === MOCK_ACCOUNT.id && password === MOCK_ACCOUNT.password) {
        return Promise.resolve({
          accessToken: 'mock-jwt-token-' + Date.now(),
          expiresIn: 3600,
          user: { id: 'operator123', name: '운영자', role: 'OPERATOR' as const },
        });
      }
      return authApi.login({ id, password });
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ token: data.accessToken, user: data.user }));
      router.replace('/dashboard');
    },
    onError: () => {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!id.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    login();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Card sx={{ width: 400, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" fontWeight={700} color="primary" mb={0.5}>
              Ops AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI 기반 인프라 모니터링 시스템
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                  {error}
                </Alert>
              )}
              <TextField
                label="아이디"
                fullWidth
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isPending}
                autoComplete="username"
                autoFocus
              />
              <TextField
                label="비밀번호"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isPending}
                sx={{ mt: 1 }}
              >
                {isPending ? <CircularProgress size={20} color="inherit" /> : '로그인'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
