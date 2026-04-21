'use client';

/**
 * @file SeverityChip.tsx
 * @description 인시던트 심각도 표시 칩 컴포넌트
 * @module shared/ui
 */

import Chip from '@mui/material/Chip';
import type { Severity } from '@/entities/incident';

const severityConfig: Record<Severity, { label: string; color: string }> = {
  fatal:    { label: 'Fatal',    color: '#7C1515' },
  critical: { label: 'Critical', color: '#DC2626' },
  major:    { label: 'Major',    color: '#F59E0B' },
  minor:    { label: 'Minor',    color: '#3B82F6' },
};

interface Props {
  severity: Severity;
  size?: 'small' | 'medium';
}

export default function SeverityChip({ severity, size = 'small' }: Props) {
  const { label, color } = severityConfig[severity];
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
