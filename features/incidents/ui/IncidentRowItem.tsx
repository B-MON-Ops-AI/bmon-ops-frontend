'use client';

/**
 * @file IncidentRowItem.tsx
 * @description 인시던트 리스트 행 컴포넌트 (엔드포인트 가시성 강화)
 * @module features/incidents/ui
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { SeverityChip, StatusChip } from '@/shared/ui';
import type { Incident } from '@/entities/incident';

const metricLabels: Record<string, string> = {
  error_rate: '에러율', response_time: '응답시간', traffic: '트래픽', request_count: '요청수',
};
const metricUnits: Record<string, string> = {
  error_rate: '%', response_time: 'ms', traffic: 'req/s', request_count: 'req',
};

interface Props {
  incident: Incident;
  onClick: (incident: Incident) => void;
}

export default function IncidentRowItem({ incident, onClick }: Props) {
  const isCritical = incident.severity === 'critical';
  const occurredAt = dayjs(incident.occurredAt);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1, overflow: 'hidden', backgroundColor: '#1a2233',
        border: '1px solid', borderColor: isCritical ? '#DC262644' : 'rgba(255,255,255,0.06)',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: isCritical ? '#DC2626' : 'primary.main', backgroundColor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <ButtonBase onClick={() => onClick(incident)} sx={{ width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left', py: 1.5, px: 2, gap: 2 }}>
        <Box sx={{ width: 4, height: 32, borderRadius: 1, backgroundColor: isCritical ? '#DC2626' : incident.severity === 'warning' ? '#F59E0B' : '#3B82F6', flexShrink: 0 }} />
        <Box sx={{ width: 140, display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <SeverityChip severity={incident.severity} size="small" />
          <StatusChip status={incident.status} size="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ color: isCritical ? 'error.light' : 'text.primary' }}>
            {incident.alarmName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{incident.unitServiceName} ({incident.unitServiceId})</Typography>
            {/* 엔드포인트 강조: 밝은 회색, 굵게, 모노스페이스 */}
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#fff', // 고대비 하얀색
                fontWeight: 800, 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                px: 0.5,
                borderRadius: 0.5
              }}
            >
              {incident.endpoint}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="caption" color="text.disabled">{metricLabels[incident.metricType]}</Typography>
            <Typography variant="body2" fontWeight={700} color="error.main">{incident.metricValue.toLocaleString()}<Typography component="span" variant="caption" color="error.light" sx={{ ml: 0.25 }}>{metricUnits[incident.metricType]}</Typography></Typography>
          </Box>
          <Tooltip title={`기준치: ${incident.baseline}${metricUnits[incident.metricType]}`}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>기준 {incident.baseline} 대비 {incident.changePercent}% 초과</Typography>
          </Tooltip>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ width: 80, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>{occurredAt.fromNow()}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.3, ml: 1 }}>→</Typography>
      </ButtonBase>
    </Paper>
  );
}
