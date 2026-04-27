'use client';

import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import SpeedIcon from '@mui/icons-material/Speed';
import MiniChart from './MiniChart';
import type { ServiceStatus, HealthStatus } from '@/entities/dashboard';

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string }> = {
  normal:   { label: '정상', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  caution:  { label: '경보', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  warning:  { label: '주의', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  danger:   { label: '위험', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  critical: { label: '장애', color: '#DC2626', bg: 'rgba(220,38,38,0.15)'  },
};

const LEVEL_COLOR: Record<string, string> = {
  Fatal: '#DC2626', Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};
const LEVEL_BG: Record<string, string> = {
  Fatal: 'rgba(220,38,38,0.1)', Critical: 'rgba(239,68,68,0.1)',
  Major: 'rgba(249,115,22,0.1)', Minor: 'rgba(245,158,11,0.1)',
};

// ── 지표 카드 ──────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, alert }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; alert?: boolean;
}) {
  return (
    <Box sx={{
      flex: 1, px: 1.5, py: 1.25,
      borderRadius: 1.5,
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: 0.25,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
        <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1 }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: alert ? '#F97316' : 'text.primary', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>{sub}</Typography>}
    </Box>
  );
}

// ── 알람 레벨 요약 ────────────────────────────────────────────
function AlarmLevelBox({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <Box sx={{
      flex: 1, textAlign: 'center', py: 1.25,
      borderRadius: 1.5,
      backgroundColor: count > 0 ? bg : 'rgba(255,255,255,0.02)',
      border: `1px solid ${count > 0 ? `${color}33` : 'rgba(255,255,255,0.06)'}`,
    }}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: count > 0 ? color : 'text.disabled', lineHeight: 1.1 }}>
        {count}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color: count > 0 ? color : 'text.disabled', fontWeight: count > 0 ? 600 : 400, lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── 드로어 ────────────────────────────────────────────────────
interface Props {
  status: ServiceStatus | null;
  onClose: () => void;
}

export default function ServiceDetailDrawer({ status, onClose }: Props) {
  if (!status) return null;

  const hc = HEALTH_CONFIG[status.health];

  const maxRespStr = status.maxResponseMs >= 1000
    ? `${(status.maxResponseMs / 1000).toFixed(2)}s`
    : `${status.maxResponseMs}ms`;
  const avgRespStr = status.avgResponseMs >= 1000
    ? `${(status.avgResponseMs / 1000).toFixed(2)}s`
    : `${status.avgResponseMs}ms`;

  return (
    <Dialog
      open={!!status}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          maxHeight: '85vh',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── 헤더 ── */}
        <Box sx={{
          px: 2.5, py: 2,
          borderLeft: `3px solid ${hc.color}`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
              {status.serviceName}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25 }}>
              {status.serviceId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={hc.label}
              size="small"
              sx={{
                height: 22, fontSize: '0.68rem', fontWeight: 700,
                backgroundColor: hc.bg, color: hc.color,
                border: `1px solid ${hc.color}44`,
                '& .MuiChip-label': { px: 1 },
              }}
            />
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── 스크롤 영역 ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* 알람 레벨 요약 */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              알람 현황
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <AlarmLevelBox label="Fatal"    count={status.alarms.fatal}    color="#DC2626" bg="rgba(220,38,38,0.1)" />
              <AlarmLevelBox label="Critical" count={status.alarms.critical} color="#EF4444" bg="rgba(239,68,68,0.1)" />
              <AlarmLevelBox label="Major"    count={status.alarms.major}    color="#F97316" bg="rgba(249,115,22,0.1)" />
              <AlarmLevelBox label="Minor"    count={status.alarms.minor}    color="#F59E0B" bg="rgba(245,158,11,0.1)" />
            </Box>
            {status.alarms.unresolved > 0 && (
              <Box sx={{ mt: 0.75, px: 1.25, py: 0.625, borderRadius: 1, backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <Typography sx={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>
                  미해소 알람 {status.alarms.unresolved}건
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 핵심 지표 */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              성능 지표
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <MetricCard
                icon={<TrendingUpIcon sx={{ fontSize: 13 }} />}
                label="처리건수"
                value={`${status.requestPerMin.toLocaleString()}`}
                sub="건 / min"
              />
              <MetricCard
                icon={<ErrorOutlineIcon sx={{ fontSize: 13 }} />}
                label="오류율"
                value={`${status.errorRate.toFixed(2)}%`}
                alert={status.errorRate >= 2}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <MetricCard
                icon={<SpeedIcon sx={{ fontSize: 13 }} />}
                label="최대 응답시간"
                value={maxRespStr}
                alert={status.maxResponseMs >= 5000}
              />
              <MetricCard
                icon={<TimerOutlinedIcon sx={{ fontSize: 13 }} />}
                label="평균 응답시간"
                value={avgRespStr}
                alert={status.avgResponseMs >= 3000}
              />
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 트래픽 추이 */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              트래픽 추이 (최근 30분)
            </Typography>
            <Box sx={{
              borderRadius: 1.5, overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              px: 1, pt: 1, pb: 0.5,
            }}>
              <MiniChart data={status.requestChart} color={hc.color} />
            </Box>
          </Box>

          {/* 미해소 알람 목록 */}
          {status.recentAlarms.length > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  미해소 알람 목록
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {status.recentAlarms.map((alarm) => (
                    <Box
                      key={alarm.seq}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 1.25, py: 0.875,
                        borderRadius: 1.5,
                        backgroundColor: LEVEL_BG[alarm.level] ?? 'rgba(255,255,255,0.02)',
                        border: `1px solid ${LEVEL_COLOR[alarm.level] ?? '#94A3B8'}22`,
                      }}
                    >
                      <Chip
                        label={alarm.level}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0,
                          backgroundColor: 'transparent',
                          color: LEVEL_COLOR[alarm.level] ?? '#94A3B8',
                          border: `1px solid ${LEVEL_COLOR[alarm.level] ?? '#94A3B8'}55`,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.4 }}>
                        {alarm.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* ── 푸터 ── */}
        <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
            마지막 업데이트: {status.updatedAt}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
