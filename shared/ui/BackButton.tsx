'use client';

/**
 * @file BackButton.tsx
 * @description 뒤로가기 버튼 컴포넌트
 * @module shared/ui
 */

import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function BackButton() {
  const router = useRouter();
  return (
    <IconButton onClick={() => router.back()} size="small" sx={{ color: 'text.secondary' }}>
      <ArrowBackIcon />
    </IconButton>
  );
}
