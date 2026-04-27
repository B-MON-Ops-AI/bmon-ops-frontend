'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MiniChart from './MiniChart';
import type { ServiceStatus, HealthStatus } from '@/entities/dashboard';

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string }> = {
  normal:   { label: '정상',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  caution:  { label: '경보',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  warning:  { label: '주의',  color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  danger:   { label: '위험',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  critical: { label: '장애',  color: '#DC2626', bg: 'rgba(220,38,38,0.15)'  },
};

const LEVEL_COLOR: Record<string, string> = {
  Fatal:    '#DC2626',
  Critical: '#EF4444',
  Major:    '#F97316',
  Minor:    '#F59E0B',
};

interface AlarmBadgeProps {
  label: string;
  count: number;
  color: string;
}

function AlarmBadge({ label, count, color }: AlarmBadgeProps) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 40 }}>
      <Typography
        sx={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: count > 0 ? color : 'text.disabled',
          lineHeight: 1.2,
        }}
      >
        {count}
      </Typography>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1.2 }}>
        {label}
      </Typography>
    </Box>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  alert?: boolean;
}

function MetricItem({ label, value, alert }: MetricItemProps) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography
        sx={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: alert ? '#F97316' : 'text.primary',
          lineHeight: 1.3,
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Box>
  );
}

interface Props {
  status: ServiceStatus;
  onClick?: () => void;
}

export default function ServiceStatusCard({ status, onClick }: Props) {
  const hc = HEALTH_CONFIG[status.health];
  const hasUnresolved = status.alarms.unresolved > 0;

  return (
    <Card
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `3px solid ${hc.color}`,
        transition: 'box-shadow 0.2s, transform 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: `0 0 0 1px ${hc.color}66, 0 4px 16px rgba(0,0,0,0.3)`,
          transform: 'translateY(-1px)',
        } : { boxShadow: `0 0 0 1px ${hc.color}44` },
      }}
    >
      <CardContent sx={{ pb: '12px !important', p: 1.5 }}>
        {/* ── 헤더 ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3 }}>
              {status.serviceName}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', lineHeight: 1.2 }}>
              {status.serviceId}
            </Typography>
          </Box>
          <Chip
            label={hc.label}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              backgroundColor: hc.bg,
              color: hc.color,
              border: `1px solid ${hc.color}44`,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

        {/* ── 알람 현황 ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <AlarmBadge label="Fatal"    count={status.alarms.fatal}    color="#DC2626" />
          <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.08)' }} />
          <AlarmBadge label="Critical" count={status.alarms.critical} color="#EF4444" />
          <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.08)' }} />
          <AlarmBadge label="Major"    count={status.alarms.major}    color="#F97316" />
          <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.08)' }} />
          <AlarmBadge label="Minor"    count={status.alarms.minor}    color="#F59E0B" />
          <Box sx={{ flex: 1 }} />
          {hasUnresolved && (
            <Typography sx={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600 }}>
              미해소 {status.alarms.unresolved}건
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

        {/* ── 핵심 지표 ── */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
          <MetricItem
            label="처리건수"
            value={`${status.requestPerMin.toLocaleString()}/min`}
          />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <MetricItem
            label="오류율"
            value={`${status.errorRate.toFixed(2)}%`}
            alert={status.errorRate >= 2}
          />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <MetricItem
            label="최대응답"
            value={status.maxResponseMs >= 1000
              ? `${(status.maxResponseMs / 1000).toFixed(1)}s`
              : `${status.maxResponseMs}ms`}
            alert={status.maxResponseMs >= 5000}
          />
        </Box>

        {/* ── 트래픽 추이 ── */}
        <MiniChart data={status.requestChart} color={hc.color} />

        {/* ── 미해소 알람 목록 ── */}
        {status.recentAlarms.length > 0 && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mt: 1, mb: 0.75 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {status.recentAlarms.slice(0, 2).map((alarm) => (
                <Box key={alarm.seq} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                  <Box
                    sx={{
                      mt: '3px',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: LEVEL_COLOR[alarm.level] ?? '#94A3B8',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {alarm.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
