'use client';

/**
 * @file ShadowTestTab.tsx
 * @description Shadow Test — 임계값 시뮬레이션 성적표 (도메인별 정방향/역방향)
 * @module widgets/shadow-test-tab/ui
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ReplayStrip from './ReplayStrip';
import { DOMAINS, getShadowTestData, forwardCountByDomain } from '@/features/shadow-test';
import type { DomainId, ShadowPeriod, Verdict, RevFlag, ForwardResult, ReverseCond, Scorecard } from '@/entities/shadow-test';

const C = { good: '#10B981', risk: '#EF4444', keep: '#64748B', warn: '#F59E0B', accent: '#6366F1', accent2: '#818CF8', muted: '#5B6577' };
const fmt = (n: number) => n.toLocaleString('en-US');

const VERDICT: Record<Verdict, { label: string; color: string; bg: string }> = {
  strong: { label: '강력 추천', color: C.accent2, bg: 'rgba(99,102,241,0.14)' },
  watch: { label: '검토 필요', color: C.warn, bg: 'rgba(245,158,11,0.12)' },
  safe: { label: '안전', color: C.good, bg: 'rgba(16,185,129,0.12)' },
};

const REV_FLAG: Record<RevFlag, { label: string; color: string; bg: string; fill: string }> = {
  unreach: { label: '🚩 도달불가 의심', color: C.risk, bg: 'rgba(239,68,68,0.12)', fill: C.risk },
  over: { label: '🚩 과대 설정', color: C.warn, bg: 'rgba(245,158,11,0.12)', fill: C.risk },
  near: { label: '정상(임박)', color: '#9AA5B8', bg: 'rgba(148,163,184,0.1)', fill: C.warn },
  ok: { label: '✅ 정상 조용', color: C.good, bg: 'rgba(16,185,129,0.12)', fill: C.good },
};

export default function ShadowTestTab() {
  const [domain, setDomain] = useState<DomainId>('all');
  const [period, setPeriod] = useState<ShadowPeriod>('week');

  const data = useMemo(() => getShadowTestData(domain, period), [domain, period]);
  const { forward, reverse, scorecard } = data;

  const runLabel = `${period === 'week' ? '지난 7일' : '전일'} · 오늘 09:00`;

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent2, fontWeight: 700, mb: 0.5 }}>
            AI Agent · 검증
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            Shadow Test — 임계값 시뮬레이션 성적표
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.75, maxWidth: '62ch' }}>
            과거 알람 이력을 후보 임계값으로 다시 재생해, 실제 결말(자동해소·사람 처리)과 대조합니다.
            자율 조정을 켜기 전 &quot;놓치지 않으면서 노이즈만 줄이는지&quot;를 데이터로 검증합니다.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            배치 실행 <b style={{ color: '#9AA5B8' }}>{runLabel}</b>
          </Typography>
          <Tabs
            value={period}
            onChange={(_, v: ShadowPeriod) => setPeriod(v)}
            sx={{
              mt: 0.75, minHeight: 32,
              '& .MuiTabs-indicator': { display: 'none' },
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', overflow: 'hidden', display: 'inline-flex',
              '& .MuiTab-root': { minHeight: 32, py: 0.75, px: 1.75, fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', textTransform: 'none', minWidth: 0 },
              '& .Mui-selected': { color: C.accent2, backgroundColor: 'rgba(99,102,241,0.16)' },
            }}
          >
            <Tab value="day" label="전일" />
            <Tab value="week" label="전주" />
          </Tabs>
        </Box>
      </Box>

      {/* 도메인 탭 */}
      <Tabs
        value={domain}
        onChange={(_, v: DomainId) => setDomain(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 40, mb: 3, borderBottom: '1px solid rgba(255,255,255,0.06)',
          '& .MuiTabs-indicator': { backgroundColor: C.accent2, height: 2 },
          '& .MuiTab-root': { minHeight: 40, py: 0, px: 1.75, fontSize: '0.82rem', fontWeight: 500, color: 'text.disabled', textTransform: 'none', '&.Mui-selected': { color: C.accent2, fontWeight: 700 } },
        }}
      >
        {DOMAINS.map((d) => (
          <Tab
            key={d.id}
            value={d.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {d.label}
                <Chip
                  label={forwardCountByDomain(d.id)}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'monospace', backgroundColor: d.id === domain ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)', color: d.id === domain ? C.accent2 : 'text.disabled', '& .MuiChip-label': { px: 0.75 } }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* 요약 성적표 */}
      <Scorecards s={scorecard} />

      {/* 정방향 */}
      <Section title="정방향 — 노이즈 감소 (임계값 상향)" tagLabel="알람 이력만 · 데이터 충분" tagColor={C.good}
        desc="뜬 적 있는 알람을 후보 임계값으로 재판정합니다. 억제될 알람 중 과거에 사람이 실제 처리했던 건(위험)이 없으면 상향은 안전합니다.">
        <Legend />
        {forward.length === 0 ? (
          <EmptyState text="이 도메인에는 재생할 알람 이력이 없습니다." />
        ) : (
          forward.map((f, i) => <ForwardCard key={i} result={f} />)
        )}
      </Section>

      {/* 역방향 */}
      <Section title="역방향 — 침묵 알람 탐지 (놓친 알람)" tagLabel="스탯 결합 · 검증 필요" tagColor={C.warn}
        desc="활성인데 오래 안 뜬 조건을, 실측 지표(bymi 스탯)와 대조합니다. 실측 최대값이 임계값에 한참 못 미치면 도달 불가능한 임계값일 수 있습니다.">
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', px: 1.75, py: 1.25, borderRadius: 1.5, backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.24)', mb: 2 }}>
          <span>⚠️</span>
          <Typography sx={{ fontSize: '0.75rem', color: '#FCD9A0', lineHeight: 1.6 }}>
            역방향은 조건↔스탯 조인이 세부 단위에서 불완전합니다. 아래는 <b>도메인/appl 레벨 근사</b> 기반의 <b>의심 신호</b>이며, 확정 판단은 운영 DB 재검증이 필요합니다.
          </Typography>
        </Box>
        {reverse.length === 0 ? (
          <EmptyState text="이 도메인에는 침묵 의심 조건이 없습니다." />
        ) : (
          reverse.map((r, i) => <ReverseCard key={i} rev={r} />)
        )}
      </Section>

      <Box sx={{ mt: 5, pt: 2.25, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', lineHeight: 1.7 }}>
          <b style={{ color: '#9AA5B8' }}>프로토타입</b> · 표시 데이터는 mock(실 운영 데이터 기반 예시)입니다.
          정량 재생·카운트는 결정적 계산으로, LangGraph/LLM은 복합 노이즈 판단·서술 레이어로 사용합니다.
        </Typography>
      </Box>
    </Box>
  );
}

// ── 요약 성적표 ────────────────────────────────────────────────
function Scorecards({ s }: { s: Scorecard }) {
  const rate = s.tot ? Math.round((s.noise / s.tot) * 100) : 0;
  const riskColor = s.risk === 0 ? C.good : C.warn;
  const tiles = [
    { c: C.accent2, lbl: '검토한 알람조건', num: fmt(s.shown), cap: '활성 조건 재생' },
    { c: C.good, lbl: '억제 가능 · 노이즈', num: fmt(s.noise), cap: '자동해소·방치 알람' },
    { c: riskColor, lbl: '놓칠 위험', num: fmt(s.risk), cap: s.risk === 0 ? '사람 처리 건 손실 0' : '⚠ 사람이 처리했던 건' },
    { c: C.accent, lbl: '예상 노이즈 감소율', num: `${rate}%`, cap: `발생 ${fmt(s.tot)}건 중 억제` },
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3.5 }}>
      {tiles.map((t, i) => (
        <Box key={i} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1.75, p: 2, background: 'linear-gradient(180deg, #1E2838, #171F2E)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: t.c }} />
          <Typography sx={{ fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.disabled', fontWeight: 600 }}>{t.lbl}</Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '1.85rem', fontWeight: 650, color: t.c, lineHeight: 1.1, mt: 1, fontVariantNumeric: 'tabular-nums' }}>{t.num}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>{t.cap}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── 섹션 래퍼 ──────────────────────────────────────────────────
function Section({ title, tagLabel, tagColor, desc, children }: { title: string; tagLabel: string; tagColor: string; desc: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 4.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</Typography>
        <Chip label={tagLabel} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, color: tagColor, backgroundColor: `${tagColor}1f`, border: `1px solid ${tagColor}47`, '& .MuiChip-label': { px: 1 } }} />
      </Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 2, maxWidth: '74ch' }}>{desc}</Typography>
      {children}
    </Box>
  );
}

function Legend() {
  const items = [
    { sw: C.good, t: '억제 · 노이즈(자동해소·방치)' },
    { sw: C.risk, t: '억제 · 위험(사람이 처리했던 것)' },
    { sw: C.keep, t: '잔존(계속 발생)' },
  ];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.75, fontSize: '0.72rem', color: 'text.secondary' }}>
      {items.map((it, i) => (
        <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 11, height: 11, borderRadius: '3px', backgroundColor: it.sw }} />{it.t}
        </Box>
      ))}
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><Box sx={{ width: 2, height: 13, backgroundColor: C.muted }} />현재 임계</Box>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><Box sx={{ width: 2, height: 13, backgroundColor: C.accent2 }} />제안 임계</Box>
    </Box>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ py: 3, textAlign: 'center', color: 'text.disabled', fontSize: '0.78rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
      {text}
    </Box>
  );
}

// ── 정방향 카드 ────────────────────────────────────────────────
function ForwardCard({ result }: { result: ForwardResult }) {
  const { cond } = result;
  const v = VERDICT[cond.verdict];
  const unit = cond.unit;
  return (
    <Box sx={{ backgroundColor: '#171F2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.75, px: 2, py: 1.75, mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.75, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.68rem', color: C.accent2, fontWeight: 600 }}>{cond.svc}</Typography>
          <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, mt: 0.25, wordBreak: 'keep-all' }}>{cond.name}</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: 'monospace', mt: 0.4 }}>
            {cond.type} · {cond.term} · 발생 {fmt(result.marks.length)}회
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: '#9AA5B8' }}>{fmt(cond.cur)}{unit}</span>
            <span style={{ color: C.muted }}>→</span>
            <span style={{ color: C.accent2, fontWeight: 650 }}>{fmt(cond.proposed)}{unit}</span>
          </Box>
          <Chip label={v.label} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, color: v.color, backgroundColor: v.bg, border: `1px solid ${v.color}55`, '& .MuiChip-label': { px: 1 } }} />
        </Box>
      </Box>
      <ReplayStrip result={result} />
    </Box>
  );
}

// ── 역방향 카드 ────────────────────────────────────────────────
function ReverseCard({ rev }: { rev: ReverseCond }) {
  const info = REV_FLAG[rev.flag];
  const ratio = Math.min(100, Math.round((rev.obsMax / rev.cur) * 100));
  return (
    <Box sx={{ backgroundColor: '#171F2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.75, px: 2, py: 1.6, mb: 1.25, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 220px auto' }, gap: 2, alignItems: 'center' }}>
      <Box>
        <Typography sx={{ fontSize: '0.68rem', color: C.accent2, fontWeight: 600 }}>{rev.svc}</Typography>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{rev.name}</Typography>
        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontFamily: 'monospace', mt: 0.4 }}>
          {rev.type} · {rev.term} · 임계 {fmt(rev.cur)}{rev.unit} · 실측 최대 {fmt(rev.obsMax)}{rev.unit} (임계의 {ratio}%)
        </Typography>
      </Box>
      <Tooltip title={`실측 최대 ${fmt(rev.obsMax)} / 임계 ${fmt(rev.cur)}`} placement="top" arrow>
        <Box sx={{ position: 'relative', height: 26 }}>
          <Box sx={{ position: 'absolute', left: 0, right: 0, top: 8, height: 10, borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'absolute', left: 0, top: 8, height: 10, borderRadius: '5px', width: `${Math.max(ratio, 2)}%`, backgroundColor: info.fill }} />
          <Box sx={{ position: 'absolute', top: 3, bottom: 3, right: 0, width: '2px', backgroundColor: C.accent2, borderRadius: '2px' }} />
          <Typography sx={{ position: 'absolute', top: -12, left: 0, fontSize: '0.55rem', fontFamily: 'monospace', color: C.muted }}>실측 최대</Typography>
          <Typography sx={{ position: 'absolute', top: -12, right: 0, fontSize: '0.55rem', fontFamily: 'monospace', color: C.muted }}>임계</Typography>
        </Box>
      </Tooltip>
      <Chip label={info.label} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, color: info.color, backgroundColor: info.bg, border: `1px solid ${info.color}55`, justifySelf: { xs: 'start', sm: 'end' }, '& .MuiChip-label': { px: 1 } }} />
    </Box>
  );
}
