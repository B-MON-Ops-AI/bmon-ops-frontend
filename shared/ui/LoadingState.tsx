'use client';

/**
 * @file LoadingState.tsx
 * @description 로딩 표시 공용 컴포넌트
 *   variant: 'spinner'(중앙 원형+라벨) | 'inline'(작은 인라인) | 'linear'(진행바, progress 지원)
 * @module shared/ui
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';

interface Props {
  /** 표시 방식 (기본 'spinner') */
  variant?: 'spinner' | 'inline' | 'linear';
  /** 안내 라벨 */
  label?: string;
  /** linear 변형에서 0~100 확정 진행률. 미지정 시 indeterminate */
  progress?: number;
}

export default function LoadingState({ variant = 'spinner', label = '불러오는 중...', progress }: Props) {
  if (variant === 'inline') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.disabled">{label}</Typography>
      </Box>
    );
  }

  if (variant === 'linear') {
    const determinate = typeof progress === 'number';
    return (
      <Box sx={{ py: 3 }}>
        {label && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <CircularProgress size={16} color="primary" />
            <Typography variant="body2" color="primary.main" fontWeight={500}>{label}</Typography>
          </Box>
        )}
        <LinearProgress
          variant={determinate ? 'determinate' : 'indeterminate'}
          value={determinate ? progress : undefined}
          sx={{ height: 6, borderRadius: 3 }}
        />
        {determinate && progress! > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
            {Math.round(progress!)}%
          </Typography>
        )}
      </Box>
    );
  }

  // spinner (기본)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 4 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  );
}
