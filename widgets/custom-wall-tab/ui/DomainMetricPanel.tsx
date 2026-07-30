'use client';

/**
 * @file DomainMetricPanel.tsx
 * @description 커스텀 Wall 도메인별 실측 지표 패널
 *   KPI 스트립 + 시간대 오버레이 차트 + granular 서비스 목록(I/D·S/E·σ, 행→알람 걸기) + 금일 알람 이력.
 * @module widgets/custom-wall-tab/ui
 */

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { MiniChart } from '@/features/dashboard';
import { useAlarmGaps } from '@/features/alarm-conditions';
import type { ChartDataPoint, DomainMetrics, DomainBreakdownItem, DomainAlarmEvent, DomainAlarmStatus } from '@/entities/dashboard';
import type { AlarmGapProposal } from '@/entities/alarm-condition';
import AlarmEventDetailDialog from './AlarmEventDetailDialog';
import HourlyOverlayChart from './HourlyOverlayChart';
import AlarmRegisterDialog from './AlarmRegisterDialog';
import BreakdownTable from './BreakdownTable';

// ── 값 포맷 ────────────────────────────────────────────────────
function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

const LEVEL_COLOR: Record<string, string> = {
  Fatal: '#DC2626', Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};

const STATUS_CONFIG: Record<DomainAlarmStatus, { label: string; color: string; bg: string }> = {
  open:     { label: '미해소', color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
  resolved: { label: '해결',   color: '#818CF8', bg: 'rgba(99,102,241,0.12)' },
  cleared:  { label: '자동해소', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
};

// ── 행 통계에서 수동 알람 제안 기본값 생성 (AI 공백 제안이 없을 때) ──
function levelByRate(v: number): AlarmGapProposal['alarmLevel'] {
  return v >= 50 ? 'Critical' : v >= 20 ? 'Major' : 'Minor';
}
function levelByRpy(v: number): AlarmGapProposal['alarmLevel'] {
  return v >= 10000 ? 'Critical' : v >= 5000 ? 'Major' : 'Minor';
}
function manualProposal(b: DomainBreakdownItem, domnId: string): AlarmGapProposal {
  const base = {
    svcNm: b.name, opNm: b.opName, domnId, type: '수동',
    baseline: null as number | null, breachHits: 0,
    detectTerm: 'HOUR1' as const, detectDow: '2345670',
    detectStTime: '0000', detectFnsTime: '2359',
    reasons: ['운영자 지정 (현재 통계 기반 기본값)'],
  };
  const er = b.errorRate ?? 0;
  if (er >= 0.5) {
    return { ...base, metric: '오류율', detectType: 'ERR_RATE', comprType: 'COMPR_MRTH',
      unit: '%', peak: er, proposedThreshold: Math.min(100, Math.max(Math.ceil(er * 1.5), 5)),
      alarmLevel: levelByRate(er) };
  }
  if (b.maxResponseMs >= 3000) {
    return { ...base, metric: '최대응답', detectType: 'RPY_TIME', comprType: 'COMPR_MRTH',
      unit: 'ms', peak: b.maxResponseMs,
      proposedThreshold: Math.max(Math.round((b.maxResponseMs * 1.2) / 100) * 100, 5000),
      alarmLevel: levelByRpy(b.maxResponseMs) };
  }
  return { ...base, metric: '오류율', detectType: 'ERR_RATE', comprType: 'COMPR_MRTH',
    unit: '%', peak: er, proposedThreshold: 5, alarmLevel: 'Minor' };
}

// ── KPI 카드 ───────────────────────────────────────────────────
interface KpiProps {
  label: string; value: string; unit?: string; sub?: string;
  color: string; trend?: ChartDataPoint[]; alert?: boolean;
  tooltipLabel?: string;                 // hover 툴팁 지표명
  valueFormatter?: (v: number) => string; // hover 값 포맷(단위 포함)
}
function KpiCard({ label, value, unit, sub, color, trend, alert, tooltipLabel, valueFormatter }: KpiProps) {
  return (
    <Box
      sx={{
        flex: 1, minWidth: 0, px: 2, py: 1.5, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', flexDirection: 'column', gap: 0.5,
      }}
    >
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, color: alert ? '#FB923C' : color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
        {unit && <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>{unit}</Typography>}
        {sub && <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', ml: 'auto' }}>{sub}</Typography>}
      </Box>
      {/* overflow:visible — hover 툴팁이 40px 카드 영역에 갇혀 겹쳐 보이지 않게 위로 띄움.
          차트 자체는 height=40으로 컨테이너와 동일해 넘칠 일 없음. */}
      <Box sx={{ height: 40, mt: 0.25, overflow: 'visible', position: 'relative' }}>
        {trend && trend.length > 0 ? (
          <MiniChart data={trend} color={alert ? '#FB923C' : color} height={40}
            tooltipLabel={tooltipLabel} valueFormatter={valueFormatter} />
        ) : (
          <Box sx={{ height: '100%' }} />
        )}
      </Box>
    </Box>
  );
}

// ── 금일 발생 알람 이력 행 ──────────────────────────────────────
function AlarmEventRow({ e, onClick }: { e: DomainAlarmEvent; onClick: () => void }) {
  const lc = LEVEL_COLOR[e.level] ?? '#94A3B8';
  const sc = STATUS_CONFIG[e.status];
  const over = e.threshold > 0 ? (e.thresholdValue / e.threshold) : 0;
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 1.25,
        cursor: 'pointer', transition: 'background-color 0.12s',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', width: 42, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {dayjs(e.occurredAt).format('HH:mm')}
      </Typography>
      <Chip label={e.level} size="small"
        sx={{ height: 18, width: 62, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0, backgroundColor: `${lc}1f`, color: lc, border: `1px solid ${lc}55`, '& .MuiChip-label': { px: 0.5 } }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.76rem', color: 'text.primary', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.alarmName}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
          {e.serviceName} · {e.detectLabel}
        </Typography>
      </Box>
      <Box sx={{ flexShrink: 0, textAlign: 'right', minWidth: 92 }}>
        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: over >= 2 ? '#F87171' : 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {e.thresholdValue.toLocaleString()}<Typography component="span" sx={{ fontSize: '0.58rem', color: 'text.disabled', ml: 0.25 }}>{e.unit}</Typography>
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
          임계 {e.threshold.toLocaleString()}{e.unit}
        </Typography>
      </Box>
      <Chip label={sc.label} size="small"
        sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0, backgroundColor: sc.bg, color: sc.color, '& .MuiChip-label': { px: 0.75 } }} />
      <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

function AlarmHistoryPanel({ events, total, hasFilter, onSelect }: {
  events: DomainAlarmEvent[]; total: number; hasFilter: boolean; onSelect: (e: DomainAlarmEvent) => void;
}) {
  const openCount = events.filter((e) => e.status === 'open').length;
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
          금일 발생 알람 이력
        </Typography>
        <Chip label={hasFilter ? `${events.length}/${total}건` : `${events.length}건`} size="small"
          sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
        {openCount > 0 && (
          <Chip label={`미해소 ${openCount}`} size="small"
            sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', '& .MuiChip-label': { px: 0.75 } }} />
        )}
        <Typography sx={{ ml: 'auto', fontSize: '0.62rem', color: 'text.disabled' }}>
          {dayjs().format('MM/DD')} 기준
        </Typography>
      </Box>
      {events.length === 0 ? (
        <Box sx={{ px: 1.75, py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.74rem', color: hasFilter ? 'text.disabled' : '#34D399' }}>
            {hasFilter ? '필터 조건에 맞는 알람이 없습니다.' : '금일 발생한 알람이 없습니다.'}
          </Typography>
        </Box>
      ) : (
        events.map((e) => <AlarmEventRow key={e.seq} e={e} onClick={() => onSelect(e)} />)
      )}
    </Box>
  );
}

// ── 메인 패널 ──────────────────────────────────────────────────
export interface DomainPanelFilters {
  svcQuery: string;
  level: string;
  status: string;
}

interface Props {
  metrics: DomainMetrics;
  filters: DomainPanelFilters;
}

export default function DomainMetricPanel({ metrics: m, filters }: Props) {
  const errRateStr = m.errorRate == null ? '무오류' : `${m.errorRate.toFixed(2)}`;
  const [selectedEvent, setSelectedEvent] = useState<DomainAlarmEvent | null>(null);
  const [registerProposal, setRegisterProposal] = useState<AlarmGapProposal | null>(null);

  // 행→알람: 해당 서비스에 AI 공백 제안이 있으면 그 값으로, 없으면 통계 기반 수동 기본값으로 프리필
  const { data: gaps } = useAlarmGaps();
  const aiBySvc = useMemo(() => {
    const map = new Map<string, AlarmGapProposal>();
    (gaps?.proposals ?? []).forEach((p) => {
      const k = `${p.svcNm}|${p.opNm}`;
      if (!map.has(k)) map.set(k, p);
    });
    return map;
  }, [gaps]);
  const aiKeys = useMemo(() => new Set(aiBySvc.keys()), [aiBySvc]);

  const openAlarm = (b: DomainBreakdownItem) => {
    const ai = aiBySvc.get(`${b.name}|${b.opName}`);
    setRegisterProposal(ai ?? manualProposal(b, m.domainId));
  };

  // ── 상단 공통 필터 적용 (클라이언트) ──
  const q = filters.svcQuery.trim().toLowerCase();
  const hasFilter = q !== '' || filters.level !== 'all' || filters.status !== 'all';

  const filteredBreakdown = useMemo(
    () =>
      q
        ? m.breakdown.filter(
            (b) => b.name.toLowerCase().includes(q) || (b.opName ?? '').toLowerCase().includes(q),
          )
        : m.breakdown,
    [m.breakdown, q],
  );

  const filteredAlarms = useMemo(
    () =>
      m.alarmHistory.filter(
        (e) =>
          (filters.level === 'all' || e.level === filters.level) &&
          (filters.status === 'all' || e.status === filters.status) &&
          (!q ||
            e.serviceName.toLowerCase().includes(q) ||
            e.alarmName.toLowerCase().includes(q)),
      ),
    [m.alarmHistory, q, filters.level, filters.status],
  );

  const isEmpty = m.throughput === 0 && m.breakdown.length === 0 && m.alarmHistory.length === 0;
  if (isEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 2 }}>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600 }}>
          {m.label} 도메인 데이터 준비 중
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 0.75 }}>
          서비스 매핑 확정 후 지표가 표시됩니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── KPI 스트립 (각 카드 hover 시 값+날짜/시각 툴팁) ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <KpiCard label="처리량" value={m.throughput.toLocaleString()} unit="건" color="#818CF8"
          trend={m.throughputTrend}
          tooltipLabel="처리량" valueFormatter={(v) => `${v.toLocaleString()}건`} />
        <KpiCard label="오류율" value={errRateStr}
          unit={m.errorRate == null ? undefined : '%'}
          sub={m.errorRate == null ? undefined : `시스템 ${m.errS} · 외부 ${m.errE}`}
          color="#34D399" trend={m.errorRate == null ? undefined : m.errorRateTrend}
          alert={m.errorRate != null && m.errorRate >= 1}
          tooltipLabel="오류율" valueFormatter={(v) => `${v.toFixed(2)}%`} />
        <KpiCard label="평균 응답시간" value={fmtMs(m.avgResponseMs)} color="#38BDF8"
          trend={m.responseTrend}
          tooltipLabel="평균응답" valueFormatter={fmtMs} />
        <KpiCard label="최대 응답 · 안정성(σ)" value={fmtMs(m.maxResponseMs)}
          sub={`σ ${fmtMs(m.responseStdDev)}`} color="#A78BFA"
          trend={m.maxResponseTrend}
          alert={m.maxResponseMs >= 5000}
          tooltipLabel="최대응답" valueFormatter={fmtMs} />
      </Box>

      {/* ── 시간대별 오버레이 차트 (정상·응답·오류) ── */}
      <HourlyOverlayChart data={m.hourlyOverlay} />

      {/* ── 서비스 granular 목록 ── */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
        <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
            {m.breakdownTitle}
          </Typography>
          <Chip label={m.breakdownType === 'service' ? '서비스 단위' : m.breakdownType === 'channel' ? '채널 단위' : 'ESB 구간'} size="small"
            sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8', '& .MuiChip-label': { px: 0.75 } }} />
          {q && (
            <Chip label={`${filteredBreakdown.length}/${m.breakdown.length}`} size="small"
              sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
          )}
          <Tooltip title="행의 알람 아이콘으로 이 서비스 지표에 알람을 등록할 수 있습니다" placement="left">
            <Typography sx={{ ml: 'auto', fontSize: '0.62rem', color: 'text.disabled', cursor: 'default' }}>
              {m.source}
            </Typography>
          </Tooltip>
        </Box>
        {filteredBreakdown.length === 0 ? (
          <Box sx={{ px: 1.75, py: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
              {q ? '검색과 일치하는 서비스가 없습니다.' : '표시할 서비스가 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <BreakdownTable
            items={filteredBreakdown}
            aiKeys={aiKeys}
            onAlarm={openAlarm}
          />
        )}
      </Box>

      {/* ── 금일 발생 알람 이력 ── */}
      <AlarmHistoryPanel
        events={filteredAlarms}
        total={m.alarmHistory.length}
        hasFilter={hasFilter}
        onSelect={setSelectedEvent}
      />

      {/* 이력 상세 */}
      <AlarmEventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* 행→알람 등록 */}
      {registerProposal && (
        <AlarmRegisterDialog
          key={`${registerProposal.svcNm}|${registerProposal.opNm}|${registerProposal.detectType}`}
          proposal={registerProposal}
          onClose={() => setRegisterProposal(null)}
          onRegistered={() => setRegisterProposal(null)}
        />
      )}
    </Box>
  );
}
