'use client';

/**
 * @file StatusChip.tsx
 * @description 인시던트 상태 표시 칩 컴포넌트
 * @module shared/ui
 */

import Chip from '@mui/material/Chip';
import type { IncidentStatus } from '@/entities/incident';

const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#EF4444' },
  acknowledged: { label: 'Acknowledged', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#10B981' },
  muted: { label: 'Muted', color: '#6B7280' },
};

interface Props {
  status: IncidentStatus;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: Props) {
  const { label, color } = statusConfig[status];
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        backgroundColor: `${color}22`,
        color: color,
        border: `1px solid ${color}66`,
        fontWeight: 600,
        fontSize: '0.7rem',
      }}
    />
  );
}
