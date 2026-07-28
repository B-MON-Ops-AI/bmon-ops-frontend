'use client';

/**
 * @file ReplayStrip.tsx
 * @description 정방향 조건의 발생값 분포를 로그축에 재생 — 현재/제안 임계선 기준 억제·잔존 표시
 * @module widgets/shadow-test-tab/ui
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { logPos } from '@/features/shadow-test';
import type { ForwardResult, MarkClass } from '@/entities/shadow-test';

const C = { noise: '#10B981', risk: '#EF4444', keep: '#64748B', accent: '#818CF8', muted: '#5B6577' };

const MARK_STYLE: Record<MarkClass, { background: string; width: number; opacity: number; boxShadow?: string }> = {
  noise: { background: C.noise, width: 2, opacity: 0.62 },
  risk: { background: C.risk, width: 3, opacity: 0.95, boxShadow: '0 0 6px rgba(239,68,68,0.6)' },
  keep: { background: C.keep, width: 2, opacity: 0.5 },
};
const MARK_LABEL: Record<MarkClass, string> = { noise: '노이즈', risk: '위험(사람 처리)', keep: '잔존' };

const fmt = (n: number) => n.toLocaleString('en-US');

export default function ReplayStrip({ result }: { result: ForwardResult }) {
  const { cond, marks, noise, risk, keep } = result;
  const unit = cond.unit;
  const axMin = Math.min(cond.vmin * 0.8, cond.cur * 0.6);
  const axMax = Math.max(cond.vmax * 1.15, cond.proposed * 1.15);
  const curP = logPos(cond.cur, axMin, axMax);
  const newP = logPos(cond.proposed, axMin, axMax);

  return (
    <Box sx={{ mt: 1.75 }}>
      <Box
        sx={{
          position: 'relative', height: 44, borderRadius: 1,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {marks.map((m, i) => {
          const s = MARK_STYLE[m.cls];
          return (
            <Tooltip key={i} title={`실측 ${fmt(m.v)}${unit} · ${MARK_LABEL[m.cls]}`} placement="top" arrow>
              <Box
                sx={{
                  position: 'absolute', bottom: 6, height: 26, borderRadius: '2px',
                  transform: 'translateX(-50%)', cursor: 'default',
                  left: `${logPos(m.v, axMin, axMax)}%`,
                  width: `${s.width}px`, backgroundColor: s.background, opacity: s.opacity,
                  boxShadow: s.boxShadow,
                }}
              />
            </Tooltip>
          );
        })}

        {/* 현재 임계선 (점선) */}
        <Box sx={{ position: 'absolute', top: 3, bottom: 3, width: '2px', left: `${curP}%`, borderRadius: '2px', backgroundImage: `repeating-linear-gradient(180deg, ${C.muted} 0 4px, transparent 4px 7px)` }} />
        <Typography sx={{ position: 'absolute', top: -16, left: `${curP}%`, transform: 'translateX(-50%)', fontSize: '0.58rem', fontFamily: 'monospace', color: C.muted, whiteSpace: 'nowrap' }}>
          현재 {fmt(cond.cur)}
        </Typography>
        {/* 제안 임계선 */}
        <Box sx={{ position: 'absolute', top: 3, bottom: 3, width: '2px', left: `${newP}%`, borderRadius: '2px', backgroundColor: C.accent, boxShadow: '0 0 8px rgba(129,140,248,0.5)' }} />
        <Typography sx={{ position: 'absolute', top: -16, left: `${Math.min(newP, 94)}%`, transform: 'translateX(-50%)', fontSize: '0.58rem', fontFamily: 'monospace', color: C.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>
          제안 {fmt(cond.proposed)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, fontSize: '0.58rem', fontFamily: 'monospace', color: C.muted }}>
        <span>{fmt(Math.round(axMin))}{unit}</span>
        <span>로그 스케일 · 발생값 분포</span>
        <span>{fmt(Math.round(axMax))}{unit}</span>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
        <Tally value={noise} label="억제 · 노이즈" color={C.noise} />
        <Tally value={risk} label="억제 · 위험" color={C.risk} />
        <Tally value={keep} label="잔존" color={C.keep} />
      </Box>
    </Box>
  );
}

function Tally({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 650, color, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(value)}
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{label}</Typography>
    </Box>
  );
}
