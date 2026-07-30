'use client';

/**
 * @file AlarmGapPanel.tsx
 * @description AI 알람 공백 제안 — byhr 통계에서 미등록·알람감 지표를 제안, 값 수정 후 등록
 * @module widgets/custom-wall-tab/ui
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import { useAlarmGaps } from '@/features/alarm-conditions';
import type { AlarmGapProposal } from '@/entities/alarm-condition';
import type { DomainId } from '@/entities/dashboard';
import AlarmRegisterDialog from './AlarmRegisterDialog';

// FE 도메인 탭 id → byhr domn_id (전체는 null = 모두)
const DOMN_BY_ID: Record<DomainId, string | null> = {
  all: null, order: 'DOMORDER', b2ccrm: 'DOMB2CCRM', rds: 'DOMRDS', lt: 'DOMLT',
};

const LEVEL_COLOR: Record<string, string> = {
  Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};

const keyOf = (p: AlarmGapProposal) => `${p.svcNm}|${p.opNm}|${p.detectType}`;

function fmtPeak(p: AlarmGapProposal): string {
  if (p.unit === 'ms') return p.peak >= 1000 ? `${(p.peak / 1000).toFixed(1)}s` : `${Math.round(p.peak)}ms`;
  return `${p.peak}${p.unit}`;
}

// 제안 근거 1개(문자열)를 신호 유형별로 색/설명 부여 → 읽기 쉬운 칩으로.
function reasonCat(r: string): { c: string; bg: string; tip: string } {
  const s = r.toLowerCase();
  if (r.includes('상한') || r.includes('초과'))
    return { c: '#F87171', bg: 'rgba(248,113,113,0.13)', tip: '절대 기준선(상한)을 넘었습니다.' };
  if (r.includes('→'))
    return { c: '#FB923C', bg: 'rgba(251,146,60,0.14)', tip: '평소 거의 없던 값이 갑자기 발생했습니다.' };
  if (r.includes('배'))
    return { c: '#34D399', bg: 'rgba(52,211,153,0.13)', tip: '평소값의 여러 배로 커졌습니다.' };
  if (s.includes('z='))
    return { c: '#818CF8', bg: 'rgba(129,140,248,0.15)', tip: '평소 변동폭(표준편차) 대비 크게 벗어났습니다.' };
  return { c: '#94A3B8', bg: 'rgba(255,255,255,0.06)', tip: '' };
}

// 구조화 필드로 만든 한 줄 평문 요약 ("무엇이 얼마→얼마, 그래서 임계 얼마 제안")
function plainReason(p: AlarmGapProposal): string {
  const u = p.unit;
  const isBlw = p.comprType === 'COMPR_BLW';
  const cur = p.unit === 'ms' && p.peak >= 1000 ? `${(p.peak / 1000).toFixed(1)}s` : `${p.peak}${u}`;
  if (isBlw) {
    return `평소 ${cur} 수준인데 이보다 크게 줄면(하한 ${p.proposedThreshold}${u}) 이상으로 봅니다.`;
  }
  const base = p.baseline != null ? `평소 ${p.baseline}${u} → ` : '';
  return `${base}현재 ${cur}까지 올라, ${p.proposedThreshold}${u} 초과 시 ${p.metric} 알람을 제안합니다.`;
}

// ── 제안 카드 ──────────────────────────────────────────────────
function GapCard({ p, onEdit, onIgnore }: {
  p: AlarmGapProposal; onEdit: (p: AlarmGapProposal) => void; onIgnore: (k: string) => void;
}) {
  const lc = LEVEL_COLOR[p.alarmLevel] ?? '#94A3B8';
  const isBlw = p.comprType === 'COMPR_BLW';  // 이하(하한) 제안 — peak는 평소량, 위험색 아님
  return (
    <Box
      sx={{
        px: 1.75, py: 1.25, borderRadius: 1.5,
        border: '1px solid rgba(99,102,241,0.22)',
        backgroundColor: 'rgba(99,102,241,0.05)',
        display: 'flex', flexDirection: 'column', gap: 0.9,
      }}
    >
      {/* 상단: 서비스·지표 | 피크/임계 | 액션 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {/* 서비스·오퍼레이션 */}
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Chip label={p.alarmLevel} size="small"
              sx={{ height: 17, fontSize: '0.58rem', fontWeight: 700, backgroundColor: `${lc}1f`, color: lc, border: `1px solid ${lc}55`, '& .MuiChip-label': { px: 0.6 } }} />
            <Chip label={p.metric} size="small"
              sx={{ height: 17, fontSize: '0.58rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', '& .MuiChip-label': { px: 0.6 } }} />
            {p.type === '상대' && (
              <Chip label="평소 대비" size="small"
                sx={{ height: 17, fontSize: '0.56rem', backgroundColor: 'rgba(52,211,153,0.12)', color: '#34D399', '& .MuiChip-label': { px: 0.6 } }} />
            )}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 500, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.svcNm}
          </Typography>
        </Box>

        {/* 피크 vs 평소 · 제안 임계 (이하 제안이면 하한) */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: isBlw ? 'text.primary' : lc, fontVariantNumeric: 'tabular-nums' }}>
            {isBlw && <Typography component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled', mr: 0.5 }}>평소</Typography>}
            {fmtPeak(p)}
            {!isBlw && p.baseline != null && (
              <Typography component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled', ml: 0.5 }}>
                평소 {p.baseline}{p.unit}
              </Typography>
            )}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: '#A5B4FC' }}>
            {isBlw ? '하한' : '제안'} 임계 {p.proposedThreshold}{p.unit} · {p.detectType}
          </Typography>
        </Box>

        {/* 액션 */}
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Button
            onClick={() => onEdit(p)}
            size="small"
            startIcon={<TuneIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              minWidth: 0, px: 1.25, height: 28, fontSize: '0.7rem', textTransform: 'none',
              color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.4)',
              '&:hover': { backgroundColor: 'rgba(99,102,241,0.15)' },
            }}
          >
            검토·등록
          </Button>
          <Tooltip title="이번 세션에서 숨김">
            <IconButton onClick={() => onIgnore(keyOf(p))} size="small"
              sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 하단: 제안 근거 (평문 요약 + 신호 칩) */}
      <Box sx={{ pt: 0.75, borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.5, mb: 0.6 }}>
          {plainReason(p)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.04em', mr: 0.25 }}>
            근거
          </Typography>
          {p.reasons.map((r) => {
            const cat = reasonCat(r);
            const chip = (
              <Chip label={r} size="small"
                sx={{ height: 19, fontSize: '0.62rem', fontWeight: 600, backgroundColor: cat.bg, color: cat.c, border: `1px solid ${cat.c}44`, '& .MuiChip-label': { px: 0.7 } }} />
            );
            return cat.tip
              ? <Tooltip key={r} title={cat.tip}>{chip}</Tooltip>
              : <Box component="span" key={r}>{chip}</Box>;
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ── 패널 ───────────────────────────────────────────────────────
export default function AlarmGapPanel({ domainId }: { domainId: DomainId }) {
  const { data, isLoading } = useAlarmGaps();
  const [open, setOpen] = useState(true);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AlarmGapProposal | null>(null);

  const domn = DOMN_BY_ID[domainId];
  const proposals = (data?.proposals ?? []).filter(
    (p) => (domn === null || p.domnId === domn) && !handled.has(keyOf(p)),
  );

  if (isLoading || proposals.length === 0) return null;

  const markHandled = (k: string) => setHandled((s) => new Set(s).add(k));

  return (
    <Box
      sx={{
        mb: 2, borderRadius: 2, overflow: 'hidden',
        border: '1px solid rgba(99,102,241,0.25)',
        backgroundColor: 'rgba(99,102,241,0.03)',
      }}
    >
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{ px: 1.75, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 16, color: '#818CF8' }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC' }}>
          AI 알람 제안
        </Typography>
        <Chip label={proposals.length} size="small"
          sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(99,102,241,0.18)', color: '#A5B4FC', '& .MuiChip-label': { px: 0.6 } }} />
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', flex: 1 }}>
          통계상 알람 등록이 필요해 보이는 미등록 지표입니다. 검토 후 값을 수정해 등록하세요.
        </Typography>
        <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.disabled', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 1.25, pb: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {proposals.map((p) => (
            <GapCard key={keyOf(p)} p={p} onEdit={setEditing} onIgnore={markHandled} />
          ))}
        </Box>
      </Collapse>

      {editing && (
        <AlarmRegisterDialog
          key={keyOf(editing)}
          proposal={editing}
          onClose={() => setEditing(null)}
          onRegistered={() => markHandled(keyOf(editing))}
        />
      )}
    </Box>
  );
}
