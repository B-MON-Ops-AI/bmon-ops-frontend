'use client';

/**
 * @file EmptyState.tsx
 * @description 데이터 없음 표시 공용 컴포넌트 (대시 테두리 + 아이콘 + 안내)
 *   DEV 데이터 특성상 빈 상태가 잦아 화면 전반에서 일관된 빈 상태 UX를 제공한다.
 * @module shared/ui
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

interface Props {
  /** 상단 아이콘 (미지정 시 기본 인박스 아이콘) */
  icon?: ReactNode;
  /** 제목 (필수) */
  title: string;
  /** 보조 설명 (선택) */
  description?: string;
  /** 하단 액션 영역 (버튼 등, 선택) */
  action?: ReactNode;
  /** 조밀 모드 — 인라인/작은 영역용 (패딩·아이콘 축소) */
  dense?: boolean;
  /** 대시 테두리 박스 표시 여부 (기본 true) */
  bordered?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  dense = false,
  bordered = true,
}: Props) {
  const iconSize = dense ? 28 : 40;
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: dense ? 3 : 6,
        px: 2,
        borderRadius: 2,
        ...(bordered && { border: '1px dashed rgba(255,255,255,0.1)' }),
      }}
    >
      <Box
        sx={{
          color: 'text.disabled',
          mb: dense ? 0.75 : 1,
          '& .MuiSvgIcon-root': { fontSize: iconSize },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {icon ?? <InboxOutlinedIcon />}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, lineHeight: 1.5 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>{action}</Box>}
    </Box>
  );
}
