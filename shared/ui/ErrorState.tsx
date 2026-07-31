'use client';

/**
 * @file ErrorState.tsx
 * @description 오류/실패 표시 공용 컴포넌트 (아이콘 + 메시지 + 선택적 재시도 버튼)
 * @module shared/ui
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  /** 제목 (기본 '오류가 발생했습니다') */
  title?: string;
  /** 보조 설명 (선택) */
  description?: string;
  /** 재시도 핸들러 — 지정 시 재시도 버튼 노출 */
  onRetry?: () => void;
  /** 재시도 버튼 라벨 (기본 '재시도') */
  retryLabel?: string;
  /** 조밀 모드 — 인라인/작은 영역용 */
  dense?: boolean;
}

export default function ErrorState({
  title = '오류가 발생했습니다',
  description,
  onRetry,
  retryLabel = '재시도',
  dense = false,
}: Props) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: dense ? 3 : 5,
        px: 2,
        borderRadius: 2,
        border: '1px solid rgba(220,38,38,0.25)',
        backgroundColor: 'rgba(220,38,38,0.05)',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: dense ? 28 : 38, color: 'error.main', mb: dense ? 0.75 : 1 }} />
      <Typography variant="body2" color="error.light" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, lineHeight: 1.5 }}>
          {description}
        </Typography>
      )}
      {onRetry && (
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 2, textTransform: 'none' }}
        >
          {retryLabel}
        </Button>
      )}
    </Box>
  );
}
