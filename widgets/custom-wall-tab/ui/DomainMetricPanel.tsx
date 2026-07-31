'use client';

/**
 * @file DomainMetricPanel.tsx
 * @description 커스텀 Wall 모니터링 패널 — 현재창(bymi 이동창) 실측 상태만.
 *   KPI 스트립 + 시간대 오버레이 차트 + granular 서비스 목록(I/D·S/E·σ) + 금일 알람 이력.
 *   ⚠ 알람 등록은 여기서 하지 않는다. 행의 알람 아이콘 → 알람 설계 탭으로 전환(byhr 축적 통계 기준).
 * @module widgets/custom-wall-tab/ui
 */

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { MiniChart, useServiceTrend } from '@/features/dashboard';
import { useAlarmGaps } from '@/features/alarm-conditions';
import type { ChartDataPoint, DomainMetrics, DomainBreakdownItem, DomainAlarmEvent, DomainAlarmStatus, DomainPeriod } from '@/entities/dashboard';
import AlarmEventDetailDialog from './AlarmEventDetailDialog';
import HourlyOverlayChart from './HourlyOverlayChart';
import BreakdownTable from './BreakdownTable';

// ── 값 포맷 ────────────────────────────────────────────────────
function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

// 서비스명/OP 검색 필터 (모듈 레벨 안정 함수 — useMemo 메모이제이션 보존)
const filterBySvc = (list: DomainBreakdownItem[], q: string): DomainBreakdownItem[] =>
  q ? list.filter((b) => b.name.toLowerCase().includes(q) || (b.opName ?? '').toLowerCase().includes(q)) : list;

// ── 오류율/오류건수 상위 서비스 섹션 (서버가 사전 랭킹, 처리량 목록과 별개) ──
function ErrorRankSection({
  title, hint, list, total, variant, q, aiKeys, onAlarm, onSelect, selectedKey,
}: {
  title: string;
  hint: string;
  list: DomainBreakdownItem[];
  total: number;
  variant: 'errrate' | 'errcount';
  q: string;
  aiKeys: Set<string>;
  onAlarm: (b: DomainBreakdownItem) => void;
  onSelect: (b: DomainBreakdownItem) => void;
  selectedKey: string | null;
}) {
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
          {title}
        </Typography>
        <Chip label={`${list.length}${q ? `/${total}` : ''}`} size="small"
          sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(248,113,113,0.14)', color: '#F87171', '& .MuiChip-label': { px: 0.75 } }} />
      </Box>
      <Box sx={{ px: 1.75, pt: 0.75 }}>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1.6 }}>
          {hint}{' · '}
          <Box component="span" sx={{ color: '#A5B4FC' }}>행 클릭 시 위 호출 추이가 해당 서비스로 전환</Box>됩니다.
        </Typography>
      </Box>
      {list.length === 0 ? (
        <Box sx={{ px: 1.75, py: 2.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            {q ? '검색과 일치하는 서비스가 없습니다.' : '오류가 발생한 서비스가 없습니다.'}
          </Typography>
        </Box>
      ) : (
        <BreakdownTable
          items={list}
          aiKeys={aiKeys}
          onAlarm={onAlarm}
          onSelect={onSelect}
          selectedKey={selectedKey}
          variant={variant}
        />
      )}
    </Box>
  );
}

const LEVEL_COLOR: Record<string, string> = {
  Fatal: '#DC2626', Critical: '#EF4444', Major: '#F97316', Minor: '#F59E0B',
};

const STATUS_CONFIG: Record<DomainAlarmStatus, { label: string; color: string; bg: string }> = {
  open:     { label: '미해소', color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
  resolved: { label: '해결',   color: '#818CF8', bg: 'rgba(99,102,241,0.12)' },
  cleared:  { label: '자동해소', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
};

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
  period: DomainPeriod;
  /** 행 알람 아이콘 클릭 → 알람 설계 탭으로 전환하며 해당 서비스 포커스 */
  onDesignAlarm: (svc: { name: string; opName: string }) => void;
}

export default function DomainMetricPanel({ metrics: m, filters, period, onDesignAlarm }: Props) {
  const errRateStr = m.errorRate == null ? '무오류' : `${m.errorRate.toFixed(2)}`;
  const [selectedEvent, setSelectedEvent] = useState<DomainAlarmEvent | null>(null);
  // 호출 추이 스코프 — null=도메인 전체 / 선택 시 해당 서비스 (처리량 상위 서비스 행 클릭)
  const [selectedSvc, setSelectedSvc] = useState<{ name: string; opName: string } | null>(null);
  const selectedKey = selectedSvc ? `${selectedSvc.name}|${selectedSvc.opName}` : null;
  const { data: svcTrend, isFetching: trendLoading } = useServiceTrend(
    m.domainId, selectedSvc?.name ?? null, selectedSvc?.opName ?? '', period,
  );
  const overlayData = selectedSvc && svcTrend ? svcTrend.hourlyOverlay : m.hourlyOverlay;
  const toggleSvc = (b: DomainBreakdownItem) =>
    setSelectedSvc((cur) =>
      cur && cur.name === b.name && cur.opName === b.opName ? null : { name: b.name, opName: b.opName },
    );

  // 행 알람 아이콘: AI 제안 있는 서비스는 인디고로 강조(힌트). 등록 자체는 알람 설계 탭에서.
  const { data: gaps } = useAlarmGaps();
  const aiKeys = useMemo(
    () => new Set((gaps?.proposals ?? []).map((p) => `${p.svcNm}|${p.opNm}`)),
    [gaps],
  );

  const openAlarm = (b: DomainBreakdownItem) => onDesignAlarm({ name: b.name, opName: b.opName });

  // ── 상단 공통 필터 적용 (클라이언트) ──
  const q = filters.svcQuery.trim().toLowerCase();
  const hasFilter = q !== '' || filters.level !== 'all' || filters.status !== 'all';

  const filteredBreakdown = useMemo(() => filterBySvc(m.breakdown, q), [m.breakdown, q]);
  const filteredErrRate = useMemo(() => filterBySvc(m.breakdownByErrorRate ?? [], q), [m.breakdownByErrorRate, q]);
  const filteredErrCount = useMemo(() => filterBySvc(m.breakdownByErrorCount ?? [], q), [m.breakdownByErrorCount, q]);

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

      {/* ── 시간대별 오버레이 차트 (기본 도메인 전체 · 서비스 클릭 시 해당 서비스) ── */}
      <HourlyOverlayChart
        data={overlayData}
        scopeLabel={selectedSvc ? `${selectedSvc.name}${selectedSvc.opName ? ' · ' + selectedSvc.opName : ''}` : undefined}
        onClear={() => setSelectedSvc(null)}
        loading={!!selectedSvc && trendLoading}
        onAnomalyClick={() => onDesignAlarm(selectedSvc ?? { name: '', opName: '' })}
      />

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
        {/* 목록 정의 안내 (모니터링: 현재창 실측 스냅샷) */}
        <Box sx={{ px: 1.75, pt: 0.75 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1.6 }}>
            정상·오류·응답은 <Box component="span" sx={{ fontWeight: 700 }}>선택 기간(상단 토글) 실측 스냅샷</Box>.
            {' · '}<Box component="span" sx={{ color: '#A5B4FC' }}>행을 클릭하면 위 호출 추이가 해당 서비스로 전환</Box>됩니다.
            {' · '}행 <Box component="span" sx={{ color: '#A5B4FC' }}>알람 아이콘(🔔)</Box>을 누르면 <Box component="span" sx={{ color: '#A5B4FC', fontWeight: 700 }}>알람 설계 탭</Box>에서 축적 통계 기준으로 등록합니다.
          </Typography>
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
            onSelect={toggleSvc}
            selectedKey={selectedKey}
            variant="monitor"
          />
        )}
      </Box>

      {/* ── 오류율 상위 서비스 (처리량과 별개로 서버가 오류율 기준 랭킹) ── */}
      <ErrorRankSection
        title="오류율 상위 서비스"
        hint="전체 호출 대비 (시스템+비즈니스) 오류 비율이 높은 서비스 (소표본 노이즈 제외)"
        list={filteredErrRate}
        total={(m.breakdownByErrorRate ?? []).length}
        variant="errrate"
        q={q}
        aiKeys={aiKeys}
        onAlarm={openAlarm}
        onSelect={toggleSvc}
        selectedKey={selectedKey}
      />

      {/* ── 오류건수 상위 서비스 ── */}
      <ErrorRankSection
        title="오류건수 상위 서비스"
        hint="발생한 오류 건수(시스템+비즈니스)가 많은 서비스"
        list={filteredErrCount}
        total={(m.breakdownByErrorCount ?? []).length}
        variant="errcount"
        q={q}
        aiKeys={aiKeys}
        onAlarm={openAlarm}
        onSelect={toggleSvc}
        selectedKey={selectedKey}
      />

      {/* ── 금일 발생 알람 이력 ── */}
      <AlarmHistoryPanel
        events={filteredAlarms}
        total={m.alarmHistory.length}
        hasFilter={hasFilter}
        onSelect={setSelectedEvent}
      />

      {/* 이력 상세 */}
      <AlarmEventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Box>
  );
}
