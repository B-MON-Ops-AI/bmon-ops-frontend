'use client';

/**
 * @file AlarmEventDetailDialog.tsx
 * @description 금일 발생 알람 이력 1건 상세 다이얼로그
 * @module widgets/custom-wall-tab/ui
 */

import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import type { DomainAlarmEvent, DomainAlarmStatus } from '@/entities/dashboard';

const LEVEL_COLOR: Record<string, string> = {
  Fatal: '#DC2626', Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};

const STATUS_CONFIG: Record<DomainAlarmStatus, { label: string; color: string; bg: string }> = {
  open:     { label: '미해소',   color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
  resolved: { label: '해결',     color: '#818CF8', bg: 'rgba(99,102,241,0.12)' },
  cleared:  { label: '자동해소', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75 }}>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', width: 76, flexShrink: 0, pt: 0.1 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

interface Props {
  event: DomainAlarmEvent | null;
  onClose: () => void;
}

export default function AlarmEventDetailDialog({ event: e, onClose }: Props) {
  const router = useRouter();
  if (!e) return null;

  const lc = LEVEL_COLOR[e.level] ?? '#94A3B8';
  const sc = STATUS_CONFIG[e.status];
  const overRatio = e.threshold > 0 ? e.thresholdValue / e.threshold : 0;

  // 미해소 알람만 처리 대상 → 인시던트 Wall로 이동(해당 알람 자동 선택)
  const handleGoResolve = () => {
    onClose();
    router.push(`/dashboard/incident-wall?seq=${e.seq}`);
  };

  return (
    <Dialog
      open={!!e}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { backgroundColor: 'background.paper', backgroundImage: 'none', maxHeight: '85vh' } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* ── 헤더 ── */}
        <Box sx={{ px: 2.5, py: 2, borderLeft: `3px solid ${lc}`, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>
              {e.alarmName}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25 }}>
              {e.serviceName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            <Chip label={e.level} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: `${lc}1f`, color: lc, border: `1px solid ${lc}55`, '& .MuiChip-label': { px: 1 } }} />
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── 본문 ── */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {/* 발생값 vs 임계 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1, textAlign: 'center', py: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: overRatio >= 2 ? '#F87171' : 'text.primary', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {e.thresholdValue.toLocaleString()}<Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled', ml: 0.25 }}>{e.unit}</Typography>
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>발생값</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', py: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: 'text.secondary', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {e.threshold.toLocaleString()}<Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled', ml: 0.25 }}>{e.unit}</Typography>
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>임계값</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', py: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: overRatio >= 2 ? '#F87171' : '#FB923C', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {overRatio ? `${overRatio.toFixed(1)}×` : '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>초과배율</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 상세 정보 */}
          <Box sx={{ borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.07)', px: 1.75, py: 0.5 }}>
            <InfoRow label="발생 시각">
              <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                {dayjs(e.occurredAt).format('YYYY-MM-DD HH:mm:ss')}
              </Typography>
            </InfoRow>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
            <InfoRow label="검출 유형">
              <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                {e.detectLabel}{e.detectTerm ? ` · ${e.detectTerm} 주기` : ''}
              </Typography>
            </InfoRow>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
            <InfoRow label="처리 상태">
              <Chip label={sc.label} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: sc.bg, color: sc.color, '& .MuiChip-label': { px: 0.75 } }} />
            </InfoRow>
            {(e.disposer || e.disposedAt) && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                <InfoRow label={e.status === 'cleared' ? '해소 시각' : '처리 정보'}>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {e.disposer ? `처리자 ${e.disposer}` : ''}
                    {e.disposer && e.disposedAt ? ' · ' : ''}
                    {e.disposedAt ? dayjs(e.disposedAt).format('HH:mm') : ''}
                  </Typography>
                </InfoRow>
              </>
            )}
          </Box>

          {/* 알람 설명 */}
          {e.alarmDesc && (
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                알람 설명
              </Typography>
              <Box sx={{ px: 1.5, py: 1.25, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.6 }}>
                  {e.alarmDesc}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* ── 푸터 ── */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {e.status === 'open' && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<BuildCircleOutlinedIcon />}
              onClick={handleGoResolve}
              sx={{ backgroundColor: '#6366F1', fontWeight: 700, '&:hover': { backgroundColor: '#4F46E5' } }}
            >
              인시던트 Wall에서 처리하기
            </Button>
          )}
          <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
            알람 이력 #{e.seq}
            {e.status === 'open'
              ? ' · 처리(해결 완료)는 인시던트 Wall에서 진행합니다'
              : ' · 이미 처리된 알람입니다'}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
