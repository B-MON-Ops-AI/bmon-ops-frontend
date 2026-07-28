'use client';

/**
 * @file DomainMetricPanel.tsx
 * @description 커스텀 Wall 도메인별 실측 지표 패널 (KPI 스트립 + 특화 카드)
 * @module widgets/custom-wall-tab/ui
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { MiniChart } from '@/features/dashboard';
import type { ChartDataPoint, DomainMetrics, DomainAlarmEvent, DomainAlarmStatus } from '@/entities/dashboard';
import AlarmEventDetailDialog from './AlarmEventDetailDialog';

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

// ── KPI 카드 ───────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  color: string;
  trend?: ChartDataPoint[];
  alert?: boolean;
}

function KpiCard({ label, value, unit, sub, color, trend, alert }: KpiProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, color: alert ? '#FB923C' : color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
        {unit && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>{unit}</Typography>
        )}
        {sub && (
          <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', ml: 'auto' }}>{sub}</Typography>
        )}
      </Box>
      <Box sx={{ height: 40, mt: 0.25 }}>
        {trend && trend.length > 0 ? (
          <MiniChart data={trend} color={alert ? '#FB923C' : color} />
        ) : (
          <Box sx={{ height: '100%' }} />
        )}
      </Box>
    </Box>
  );
}

// ── 특화 카드(하단) 항목 ────────────────────────────────────────
function BreakdownRow({
  name, opName, throughput, errorRate, avgResponseMs, maxResponseMs, ratio,
}: {
  name: string; opName: string; throughput: number; errorRate: number | null;
  avgResponseMs: number; maxResponseMs: number; ratio: number;
}) {
  const errColor = errorRate == null ? '#64748B' : errorRate >= 1 ? '#F87171' : errorRate >= 0.5 ? '#FB923C' : '#34D399';
  return (
    <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 500, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            op: {opName || '—'}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', flexShrink: 0, pt: 0.1 }}>
          {throughput.toLocaleString()}
          <Typography component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled', ml: 0.25 }}>건</Typography>
        </Typography>
      </Box>
      {/* 처리량 비율 바 */}
      <Box sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', mb: 0.75 }}>
        <Box sx={{ height: '100%', width: `${Math.max(2, ratio * 100)}%`, backgroundColor: '#6366F1', borderRadius: 2 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Typography sx={{ fontSize: '0.66rem', color: errColor }}>
          오류율 {errorRate == null ? '무오류' : `${errorRate.toFixed(2)}%`}
        </Typography>
        <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled' }}>
          평균 {fmtMs(avgResponseMs)}
        </Typography>
        <Typography sx={{ fontSize: '0.66rem', color: maxResponseMs >= 5000 ? '#FB923C' : 'text.disabled' }}>
          최대 {fmtMs(maxResponseMs)}
        </Typography>
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
      {/* 시각 */}
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', width: 42, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {dayjs(e.occurredAt).format('HH:mm')}
      </Typography>
      {/* 등급 */}
      <Chip
        label={e.level}
        size="small"
        sx={{ height: 18, width: 62, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0, backgroundColor: `${lc}1f`, color: lc, border: `1px solid ${lc}55`, '& .MuiChip-label': { px: 0.5 } }}
      />
      {/* 서비스 · 알람명 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.76rem', color: 'text.primary', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.alarmName}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
          {e.serviceName} · {e.detectLabel}
        </Typography>
      </Box>
      {/* 발생값 / 임계 */}
      <Box sx={{ flexShrink: 0, textAlign: 'right', minWidth: 92 }}>
        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: over >= 2 ? '#F87171' : 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {e.thresholdValue.toLocaleString()}<Typography component="span" sx={{ fontSize: '0.58rem', color: 'text.disabled', ml: 0.25 }}>{e.unit}</Typography>
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
          임계 {e.threshold.toLocaleString()}{e.unit}
        </Typography>
      </Box>
      {/* 처리 상태 */}
      <Chip
        label={sc.label}
        size="small"
        sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0, backgroundColor: sc.bg, color: sc.color, '& .MuiChip-label': { px: 0.75 } }}
      />
      <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

// ── 금일 발생 알람 이력 패널 ────────────────────────────────────
function AlarmHistoryPanel({ events, onSelect }: { events: DomainAlarmEvent[]; onSelect: (e: DomainAlarmEvent) => void }) {
  const openCount = events.filter((e) => e.status === 'open').length;
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
          금일 발생 알람 이력
        </Typography>
        <Chip
          label={`${events.length}건`}
          size="small"
          sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', '& .MuiChip-label': { px: 0.75 } }}
        />
        {openCount > 0 && (
          <Chip
            label={`미해소 ${openCount}`}
            size="small"
            sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', '& .MuiChip-label': { px: 0.75 } }}
          />
        )}
        <Typography sx={{ ml: 'auto', fontSize: '0.62rem', color: 'text.disabled' }}>
          {dayjs().format('MM/DD')} 기준
        </Typography>
      </Box>
      {events.length === 0 ? (
        <Box sx={{ px: 1.75, py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.74rem', color: '#34D399' }}>금일 발생한 알람이 없습니다.</Typography>
        </Box>
      ) : (
        events.map((e) => <AlarmEventRow key={e.seq} e={e} onClick={() => onSelect(e)} />)
      )}
    </Box>
  );
}

// ── 메인 패널 ──────────────────────────────────────────────────
interface Props {
  metrics: DomainMetrics;
}

export default function DomainMetricPanel({ metrics: m }: Props) {
  const maxThroughput = Math.max(...m.breakdown.map((b) => b.throughput), 1);
  const errRateStr = m.errorRate == null ? '무오류' : `${m.errorRate.toFixed(2)}`;
  const [selectedEvent, setSelectedEvent] = useState<DomainAlarmEvent | null>(null);

  // 데이터 소스 미할당 도메인(LT 등) → 준비 중 안내
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

      {/* ── KPI 스트립 ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <KpiCard
          label="처리량"
          value={m.throughput.toLocaleString()}
          unit="건"
          color="#818CF8"
          trend={m.throughputTrend}
        />
        <KpiCard
          label="오류율"
          value={errRateStr}
          unit={m.errorRate == null ? undefined : '%'}
          sub={m.errorRate == null ? undefined : `시스템 ${m.errS} · 외부 ${m.errE}`}
          color="#34D399"
          trend={m.errorRate == null ? undefined : m.errorRateTrend}
          alert={m.errorRate != null && m.errorRate >= 1}
        />
        <KpiCard
          label="평균 응답시간"
          value={fmtMs(m.avgResponseMs)}
          color="#38BDF8"
          trend={m.responseTrend}
        />
        <KpiCard
          label="최대 응답 · 안정성(σ)"
          value={fmtMs(m.maxResponseMs)}
          sub={`σ ${fmtMs(m.responseStdDev)}`}
          color="#A78BFA"
          alert={m.maxResponseMs >= 5000}
        />
      </Box>

      {/* ── 특화 카드 (처리량 상위 서비스 등) ── */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
        <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
            {m.breakdownTitle}
          </Typography>
          <Chip
            label={m.breakdownType === 'service' ? '서비스 단위' : m.breakdownType === 'channel' ? '채널 단위' : 'ESB 구간'}
            size="small"
            sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8', '& .MuiChip-label': { px: 0.75 } }}
          />
          <Tooltip title={`원천: ${m.source}`} placement="left">
            <Typography sx={{ ml: 'auto', fontSize: '0.62rem', color: 'text.disabled', cursor: 'default' }}>
              {m.source}
            </Typography>
          </Tooltip>
        </Box>
        {m.breakdown.map((b) => (
          <BreakdownRow
            key={`${b.name}-${b.opName}`}
            name={b.name}
            opName={b.opName}
            throughput={b.throughput}
            errorRate={b.errorRate}
            avgResponseMs={b.avgResponseMs}
            maxResponseMs={b.maxResponseMs}
            ratio={b.throughput / maxThroughput}
          />
        ))}
      </Box>

      {/* ── 금일 발생 알람 이력 (특화 카드 하위) ── */}
      <AlarmHistoryPanel events={m.alarmHistory} onSelect={setSelectedEvent} />

      {/* 이력 상세 */}
      <AlarmEventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Box>
  );
}
