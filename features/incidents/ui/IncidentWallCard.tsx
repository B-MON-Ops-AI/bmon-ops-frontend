'use client';

/**
 * @file IncidentWallCard.tsx
 * @description 인시던트 월 카드 컴포넌트 (엔드포인트 가시성 강화)
 * @module features/incidents/ui
 */

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { SeverityChip, StatusChip } from '@/shared/ui';
import type { Incident } from '@/entities/incident';

dayjs.extend(relativeTime);
dayjs.locale('ko');

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

export default function IncidentWallCard({ incident, onClick }: Props) {
  const isCritical = incident.severity === 'critical';

  return (
    <Card
      sx={{
        position: 'relative', overflow: 'hidden', height: '100%',
        border: isCritical ? '1px solid #DC262666' : '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isCritical ? '#DC2626aa' : 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        },
        ...(isCritical && {
          '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#DC2626' },
        }),
      }}
    >
      <CardActionArea onClick={() => onClick(incident)} sx={{ height: '100%' }}>
        <CardContent sx={{ pt: isCritical ? 2.5 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <SeverityChip severity={incident.severity} size="small" />
              <StatusChip status={incident.status} size="small" />
            </Box>
            <Typography variant="caption" color="text.disabled">
              {dayjs(incident.occurredAt).fromNow()}
            </Typography>
          </Box>

          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, minHeight: 40, lineHeight: 1.3, color: isCritical ? 'error.light' : 'text.primary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {incident.alarmName}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" display="block" color="text.secondary" fontWeight={600} noWrap>{incident.unitServiceName} ({incident.unitServiceId})</Typography>
            {/* 엔드포인트 강조: 하얀색, 굵게, 모노스페이스 */}
            <Typography 
              variant="caption" 
              display="block" 
              sx={{ 
                mt: 0.5,
                color: '#e5e7eb', // 고대비 회색
                fontWeight: 800, 
                fontFamily: 'monospace', 
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                px: 0.5,
                borderRadius: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {incident.endpoint}
            </Typography>
          </Box>

          <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">현재 {metricLabels[incident.metricType]}</Typography>
              <Typography variant="h6" fontWeight={800} color="error.main" sx={{ lineHeight: 1 }}>{incident.metricValue.toLocaleString()}<Typography component="span" variant="caption" color="error.light" sx={{ ml: 0.25 }}>{metricUnits[incident.metricType]}</Typography></Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: '0.65rem' }}>기준 {incident.baseline} 대비</Typography>
              <Typography variant="caption" fontWeight={700} color="error.light">+{incident.changePercent}% 초과</Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
