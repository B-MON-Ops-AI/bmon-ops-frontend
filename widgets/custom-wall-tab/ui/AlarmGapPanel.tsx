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
import CircularProgress from '@mui/material/CircularProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import TimelineIcon from '@mui/icons-material/Timeline';
import CloseIcon from '@mui/icons-material/Close';
import { useAlarmGaps, useProposalsOverview } from '@/features/alarm-conditions';
import type { AlarmGapProposal } from '@/entities/alarm-condition';
import type { DomainId } from '@/entities/dashboard';
import AlarmRegisterDialog from './AlarmRegisterDialog';
import AlarmEvidenceDialog from './AlarmEvidenceDialog';

// FE 도메인 탭 id → byhr domn_id (전체는 null = 모두)
const DOMN_BY_ID: Record<DomainId, string | null> = {
  all: null, order: 'DOMORDER', b2ccrm: 'DOMB2CCRM', rds: 'DOMRDS', lt: 'DOMLT',
};

const LEVEL_COLOR: Record<string, string> = {
  Fatal: '#DC2626', Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};

const keyOf = (p: AlarmGapProposal) => `${p.svcNm}|${p.opNm}|${p.detectType}`;

function fmtPeak(p: AlarmGapProposal): string {
  if (p.unit === 'ms') return p.peak >= 1000 ? `${(p.peak / 1000).toFixed(1)}s` : `${Math.round(p.peak)}ms`;
  return `${p.peak}${p.unit}`;
}

// 옛/캐시 데이터에 남은 통계 용어(z=NNN)를 평문으로 안전 변환 (BE는 이미 평문 반환).
function humanizeReason(r: string): string {
  return r
    .replace(/평소\s*대비\s*z\s*=\s*\d+(?:\.\d+)?/gi, '평소 범위를 크게 벗어남')
    .replace(/z\s*=\s*\d+(?:\.\d+)?/gi, '평소 범위를 벗어남');
}

// 제안 근거 1개(문자열)를 신호 유형별로 색/설명 부여 → 읽기 쉬운 칩으로. (통계 용어 없이 평문 툴팁)
function reasonCat(r: string): { c: string; bg: string; tip: string } {
  if (r.includes('초과'))
    return { c: '#F87171', bg: 'rgba(248,113,113,0.13)', tip: '설정한 안전 기준선을 넘었습니다.' };
  if (r.includes('거의 없'))
    return { c: '#818CF8', bg: 'rgba(129,140,248,0.15)', tip: '평소엔 거의 없던 값이 갑자기 나타났습니다.' };
  if (r.includes('벗어'))
    return { c: '#818CF8', bg: 'rgba(129,140,248,0.15)', tip: '평소 이 시간대 값의 일반적인 범위를 크게 넘어섰습니다.' };
  if (r.includes('배'))
    return { c: '#34D399', bg: 'rgba(52,211,153,0.13)', tip: '평소값의 여러 배로 커졌습니다.' };
  if (r.includes('→'))
    return { c: '#FB923C', bg: 'rgba(251,146,60,0.14)', tip: '평소보다 크게 늘었습니다.' };
  if (r.includes('줄면'))
    return { c: '#FBBF24', bg: 'rgba(251,191,36,0.13)', tip: '평소보다 크게 줄면 이상으로 봅니다.' };
  return { c: '#94A3B8', bg: 'rgba(255,255,255,0.06)', tip: '' };
}

// 구조화 필드로 만든 한 줄 평문 요약 ("무엇이 얼마→얼마, 그래서 임계 얼마 제안")
function plainReason(p: AlarmGapProposal): string {
  const u = p.unit;
  const isBlw = p.comprType === 'COMPR_BLW';
  const cur = p.unit === 'ms' && p.peak >= 1000 ? `${(p.peak / 1000).toFixed(1)}s` : `${p.peak}${u}`;
  if (isBlw) {
    return `평소 시간당 ${cur} 수준인데 이보다 크게 줄면(하한 ${p.proposedThreshold}${u}) 이상으로 봅니다.`;
  }
  const base = p.baseline != null ? `평소(같은요일 최근 28일 평균) ${p.baseline}${u} → ` : '';
  return `${base}최신일 시간대 최고 ${cur}까지 올라, ${p.proposedThreshold}${u} 초과 시 ${p.metric} 알람을 제안합니다.`;
}

// ── 제안 카드 ──────────────────────────────────────────────────
function GapCard({ p, onEdit, onIgnore, onEvidence }: {
  p: AlarmGapProposal; onEdit: (p: AlarmGapProposal) => void; onIgnore: (k: string) => void;
  onEvidence: (p: AlarmGapProposal) => void;
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
            {p.breachHits > 1 && (
              <Tooltip title="기준일에 여러 시간대에서 반복 발생 — 일회성이 아닙니다">
                <Chip label={`오늘 ${p.breachHits}개 시간대`} size="small"
                  sx={{ height: 17, fontSize: '0.56rem', fontWeight: 700, backgroundColor: 'rgba(251,146,60,0.15)', color: '#FB923C', '& .MuiChip-label': { px: 0.6 } }} />
              </Tooltip>
            )}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 500, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.svcNm}
          </Typography>
        </Box>

        {/* 피크 vs 평소 · 제안 임계 (이하 제안이면 하한) */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: isBlw ? 'text.primary' : lc, fontVariantNumeric: 'tabular-nums' }}>
            <Typography component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled', mr: 0.5 }}>
              {isBlw ? '평소' : '최신일 최고'}
            </Typography>
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
            onClick={() => onEvidence(p)}
            size="small"
            startIcon={<TimelineIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              minWidth: 0, px: 1.25, height: 28, fontSize: '0.7rem', textTransform: 'none',
              color: 'text.secondary', border: '1px solid rgba(255,255,255,0.15)',
              '&:hover': { color: '#A5B4FC', borderColor: 'rgba(99,102,241,0.4)', backgroundColor: 'rgba(99,102,241,0.08)' },
            }}
          >
            근거 내역
          </Button>
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
          <Tooltip title="이 세션에서만 숨김 — 새로고침하면 다시 표시됩니다(상태 저장 안 함)">
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
          {p.reasons.map((raw) => {
            const r = humanizeReason(raw);
            const cat = reasonCat(r);
            const chip = (
              <Chip label={r} size="small"
                sx={{ height: 19, fontSize: '0.62rem', fontWeight: 600, backgroundColor: cat.bg, color: cat.c, border: `1px solid ${cat.c}44`, '& .MuiChip-label': { px: 0.7 } }} />
            );
            return cat.tip
              ? <Tooltip key={raw} title={cat.tip}>{chip}</Tooltip>
              : <Box component="span" key={raw}>{chip}</Box>;
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
  const [evidence, setEvidence] = useState<AlarmGapProposal | null>(null);
  const [overviewOn, setOverviewOn] = useState(false);
  const { data: overview, isLoading: overviewLoading } = useProposalsOverview(overviewOn);

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
          {/* 제안 수명 안내 — 미확인 시 동작 (상태 저장 안 함) */}
          <Box sx={{ px: 1, py: 0.75, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1.55 }}>
              제안은 <Box component="span" sx={{ fontWeight: 700 }}>업무시간(08:00~19:00)</Box> 통계로 5분마다 다시 계산됩니다.
              확인하지 않아도 조건이 지속되면 계속 표시되고, <Box component="span" sx={{ color: '#A5B4FC' }}>등록</Box>하거나 숨기기 전까지 남습니다.
              단, 상태를 저장하지 않으므로 <Box component="span" sx={{ fontWeight: 700 }}>기준일이 바뀌면 최신 데이터 기준으로 갱신</Box>됩니다 —
              반복 발생(<Box component="span" sx={{ color: '#FB923C' }}>오늘 N개 시간대</Box>) 표시가 있으면 우선 검토하세요.
            </Typography>
          </Box>

          {/* AI 종합 분석 (교차 해석, 온디맨드) */}
          <Box sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid rgba(99,102,241,0.2)', backgroundColor: 'rgba(99,102,241,0.04)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <AutoAwesomeIcon sx={{ fontSize: 15, color: '#818CF8' }} />
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#A5B4FC' }}>AI 종합 분석</Typography>
              {overview && (
                <Chip label={overview.source === 'ai' ? 'AI 생성' : '규칙 기반'} size="small"
                  sx={{ height: 16, fontSize: '0.55rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.disabled', '& .MuiChip-label': { px: 0.6 } }} />
              )}
              <Box sx={{ flex: 1 }} />
              {!overviewOn ? (
                <Button onClick={() => setOverviewOn(true)} size="small"
                  sx={{ minWidth: 0, px: 1.25, height: 26, fontSize: '0.68rem', textTransform: 'none',
                    color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.4)', '&:hover': { backgroundColor: 'rgba(99,102,241,0.15)' } }}>
                  분석 보기
                </Button>
              ) : overviewLoading ? (
                <CircularProgress size={13} sx={{ color: '#818CF8' }} />
              ) : null}
            </Box>
            {!overviewOn ? (
              <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mt: 0.5 }}>
                여러 제안의 공통점·우선순위를 한 번에 정리해 드립니다.
              </Typography>
            ) : overview ? (
              <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.primary', lineHeight: 1.55 }}>
                  {overview.insight}
                </Typography>
                {overview.groups.map((g) => (
                  <Box key={g.title} sx={{ pl: 1, borderLeft: '2px solid rgba(99,102,241,0.35)' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary' }}>{g.title}</Typography>
                    {g.note && <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', lineHeight: 1.5 }}>{g.note}</Typography>}
                    {g.svcNms.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.3 }}>
                        {g.svcNms.map((s) => (
                          <Chip key={s} label={s} size="small"
                            sx={{ height: 16, fontSize: '0.56rem', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary', '& .MuiChip-label': { px: 0.5 } }} />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            ) : overviewLoading ? (
              <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mt: 0.5 }}>분석 중…</Typography>
            ) : null}
          </Box>

          {proposals.map((p) => (
            <GapCard key={keyOf(p)} p={p} onEdit={setEditing} onIgnore={markHandled} onEvidence={setEvidence} />
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

      <AlarmEvidenceDialog proposal={evidence} onClose={() => setEvidence(null)} />
    </Box>
  );
}
