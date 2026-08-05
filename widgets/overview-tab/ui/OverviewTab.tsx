'use client';

/**
 * @file OverviewTab.tsx
 * @description 대시보드 개요 탭 — KPI 카드 + 차트 (mo_alarm_hst 집계 기반)
 * @module widgets/overview-tab/ui
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useSummary, useHourlyTrend } from '@/features/dashboard';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// ── 색상 상수 ────────────────────────────────────────────
const C = {
  fatal:    '#991B1B',  // 진한 빨강 (가장 위급)
  critical: '#EF4444',  // 밝은 빨강
  major:    '#F59E0B',
  minor:    '#3B82F6',
  card:     '#1a2233',
  border:   'rgba(255,255,255,0.07)',
  muted:    'rgba(255,255,255,0.35)',
};

const SEV_COLOR: Record<string, string> = {
  fatal: C.fatal, critical: C.critical, major: C.major, minor: C.minor,
};
const SEV_LABEL: Record<string, string> = {
  fatal: 'Fatal', critical: 'Critical', major: 'Major', minor: 'Minor',
};
const DETECT_COLORS = ['#6366F1','#22D3EE','#F59E0B','#10B981','#EC4899'];

// 심각도 추이 시리즈 정의 (stack 순서 = 배열 순서)
const SEV_AREAS = [
  { key: 'fatal',    name: 'Fatal',    color: C.fatal,    grad: 'gfatal' },
  { key: 'critical', name: 'Critical', color: C.critical, grad: 'gcritical' },
  { key: 'major',    name: 'Major',    color: C.major,    grad: 'gmajor' },
  { key: 'minor',    name: 'Minor',    color: C.minor,    grad: 'gminor' },
] as const;
type SevKey = (typeof SEV_AREAS)[number]['key'];

// ── 공통 카드 래퍼 ───────────────────────────────────────
function Card({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        p: 2.5,
        height: '100%',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      sx={{ color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 2 }}
    >
      {children}
    </Typography>
  );
}

// ── 빈 상태 가이드 (인시던트 없음) ────────────────────────
function EmptyState({ message, height = 150 }: { message: string; height?: number | string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, height }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 26, color: 'rgba(52,211,153,0.5)' }} />
      <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.72rem' }}>{message}</Typography>
    </Box>
  );
}

// ── KPI 카드 ─────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  pulse?: boolean;
}

function KpiCard({ label, value, sub, accent = '#6366F1', pulse = false }: KpiCardProps) {
  return (
    <Card>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {pulse && (
            <Box
              sx={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: accent,
                boxShadow: `0 0 10px ${accent}`,
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
          <Typography variant="h4" fontWeight={800} sx={{ color: accent, lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        {sub && (
          <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.68rem' }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

// ── 기간 선택 세그먼트 ────────────────────────────────────
const DAY_OPTIONS = [
  { value: 1,  label: '오늘' },
  { value: 7,  label: '7일' },
  { value: 30, label: '30일' },
];

function DaySegment({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        borderRadius: '10px',
        border: `1px solid ${C.border}`,
        backgroundColor: '#1F2937',
        p: '3px', gap: '2px',
      }}
    >
      {DAY_OPTIONS.map((opt) => {
        const sel = value === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              px: 1.5, py: 0.5, borderRadius: '7px', cursor: 'pointer', userSelect: 'none',
              backgroundColor: sel ? 'rgba(99,102,241,0.2)' : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': { backgroundColor: sel ? undefined : 'rgba(255,255,255,0.06)' },
            }}
          >
            <Typography variant="caption" fontWeight={sel ? 700 : 400}
              sx={{ lineHeight: 1, color: sel ? '#818CF8' : C.muted, whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Tooltip 커스텀 ────────────────────────────────────────
function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ backgroundColor: '#0F172A', border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1.5, minWidth: 120 }}>
      {label && <Typography variant="caption" sx={{ color: C.muted, display: 'block', mb: 0.5 }}>{label}</Typography>}
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.72rem' }}>
            {p.name}: <strong>{p.value}</strong>건
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── 심각도 추이 데이터 유틸 ───────────────────────────────
type TrendRow = { fatal: number; critical: number; major: number; minor: number };
type DailyTrendItem = TrendRow & { date: string };

// 일별 추이를 날짜별로 합산 (중복 날짜 행 정규화)
function aggregateTrendByDate(rows: DailyTrendItem[]): DailyTrendItem[] {
  const byDate = new Map<string, DailyTrendItem>();
  for (const d of rows) {
    const cur = byDate.get(d.date) ?? { date: d.date, fatal: 0, critical: 0, major: 0, minor: 0 };
    cur.fatal += d.fatal ?? 0;
    cur.critical += d.critical ?? 0;
    cur.major += d.major ?? 0;
    cur.minor += d.minor ?? 0;
    byDate.set(d.date, cur);
  }
  return Array.from(byDate.values());
}

// 최근 days일을 모두 채운 조밀 시리즈 (데이터 없는 날은 0). BE는 발생일만 보내므로 x축이 비게 되는데,
// 없는 날짜도 0으로 채워 축에 모든 날이 찍히고(=7/30일치) 0인 날이 그래프에 0으로 드러나게 한다.
function buildDenseDailyTrend(agg: DailyTrendItem[], days: number): DailyTrendItem[] {
  const byDate = new Map(agg.map((d) => [d.date, d]));
  const out: DailyTrendItem[] = [];
  const today = dayjs();
  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, 'day').format('MM-DD'); // BE의 TO_CHAR('MM-DD')와 동일 포맷
    out.push(byDate.get(date) ?? { date, fatal: 0, critical: 0, major: 0, minor: 0 });
  }
  return out;
}

// 전 구간 합이 0인 심각도는 렌더에서 제외 → stacked area에서 0 시리즈가 누적 상단에
// 선으로 그려져 "데이터가 있는 것처럼" 보이는 문제를 막는다.
function activeSeverities(rows: TrendRow[]): SevKey[] {
  return SEV_AREAS.map((a) => a.key).filter((k) => rows.some((r) => (r[k] ?? 0) > 0));
}

const SEV_GRADIENTS = (
  <defs>
    <linearGradient id="gfatal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.fatal} stopOpacity={0.4} />
      <stop offset="95%" stopColor={C.fatal} stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="gcritical" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.critical} stopOpacity={0.3} />
      <stop offset="95%" stopColor={C.critical} stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="gmajor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.major} stopOpacity={0.25} />
      <stop offset="95%" stopColor={C.major} stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="gminor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.minor} stopOpacity={0.2} />
      <stop offset="95%" stopColor={C.minor} stopOpacity={0.02} />
    </linearGradient>
  </defs>
);

// 심각도 스택 추이 차트 (시간대별·일별 공용)
function SeverityTrendChart({ data, xKey, interval, tickFormatter }: {
  data: (TrendRow & Record<string, unknown>)[];
  xKey: string;
  interval: number;
  tickFormatter?: (v: string) => string;
}) {
  const active = activeSeverities(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        {SEV_GRADIENTS}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} tick={{ fill: C.muted, fontSize: 10 }} interval={interval} tickFormatter={tickFormatter} />
        <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax, 5)]} />
        <Tooltip content={<DarkTooltip />} />
        <Legend formatter={(v) => <span style={{ color: C.muted, fontSize: '0.7rem' }}>{v}</span>} wrapperStyle={{ paddingTop: 8 }} />
        {/* 비누적(겹침) — 각 등급을 0 기준으로 그려 실제 크기를 직접 비교.
            누적(stackId) 시 작은 등급이 큰 등급 위에 얹혀 더 커 보이는 오해를 방지. */}
        {SEV_AREAS.filter((a) => active.includes(a.key)).map((a) => (
          <Area key={a.key} type="monotone" dataKey={a.key} name={a.name}
            stroke={a.color} fill={`url(#${a.grad})`} strokeWidth={2} dot={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function OverviewTab() {
  const [days, setDays] = useState(7);
  const { data, isLoading } = useSummary(days);
  const isToday = days === 1;
  const { data: hourlyData, isLoading: isHourlyLoading } = useHourlyTrend();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const { kpi, severityCounts, serviceRanking, detectTypeCounts, dailyTrend, recentCritical } = data;

  const sevTotal = severityCounts.reduce((s: number, r: { count: number }) => s + r.count, 0) || 1;
  const periodLabel = isToday ? '오늘' : `최근 ${days}일`;

  // 데이터 유무 (빈 상태 가이드 노출 판단)
  const hasSeverity = severityCounts.some((r: { count: number }) => r.count > 0);
  const hasService = serviceRanking.length > 0;
  const hasDetect = detectTypeCounts.length > 0;
  const hourlyRows = hourlyData?.hourlyTrend ?? [];
  const hasHourly = hourlyRows.some((h: TrendRow) => (h.fatal + h.critical + h.major + h.minor) > 0);

  // 일별 추이: 날짜별 합산 후 최근 days일을 모두 0으로 채워 x축을 조밀하게(이슈 2·4)
  const dailyTrendDense = buildDenseDailyTrend(aggregateTrendByDate(dailyTrend), days);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── 헤더 ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>운영 현황 개요</Typography>
          <Typography variant="caption" sx={{ color: C.muted }}>
            {dayjs().format('YYYY-MM-DD HH:mm')} 기준 · mo_alarm_hst
          </Typography>
        </Box>
        <DaySegment value={days} onChange={setDays} />
      </Box>

      {/* ── KPI 카드 4개 ── */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="Fatal·Critical 활성"
            value={kpi.criticalActive}
            sub="미해결 Fatal + Critical"
            accent={C.critical}
            pulse={kpi.criticalActive > 0}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="전체 인시던트"
            value={kpi.totalIncidents}
            sub={`활성 ${kpi.activeIncidents}건 포함`}
            accent="#6366F1"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="미해결"
            value={kpi.activeIncidents}
            sub={`전체의 ${Math.round(kpi.activeIncidents / (kpi.totalIncidents || 1) * 100)}%`}
            accent="#F59E0B"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard
            label="자동 해소율"
            value={`${kpi.autoClearRate}%`}
            sub="clear_yn=Y 비율"
            accent="#10B981"
          />
        </Grid>
      </Grid>

      {/* ── 차트 Row 1: 심각도 도넛 + 도메인별 + 검출유형 ── */}
      <Grid container spacing={2}>

        {/* 심각도별 분포 — 도넛 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardTitle>심각도별 분포</CardTitle>
            {!hasSeverity ? (
              <EmptyState message={`${periodLabel} 인시던트 없음`} height={130} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      data={severityCounts}
                      cx="50%" cy="50%"
                      innerRadius={38} outerRadius={58}
                      dataKey="count"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {severityCounts.map((entry: { severity: string }, i: number) => (
                        <Cell key={i} fill={SEV_COLOR[entry.severity] ?? '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as { severity: string; count: number };
                        return (
                          <Box sx={{ backgroundColor: '#0F172A', border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1.25 }}>
                            <Typography variant="caption" sx={{ color: '#fff' }}>
                              {SEV_LABEL[d.severity]}: <strong>{d.count}건</strong> ({Math.round(d.count / sevTotal * 100)}%)
                            </Typography>
                          </Box>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                  {severityCounts.map((r: { severity: string; count: number }) => (
                    <Box key={r.severity} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: SEV_COLOR[r.severity] ?? '#6B7280', flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: C.muted, flex: 1, fontSize: '0.7rem' }}>
                        {SEV_LABEL[r.severity]}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: SEV_COLOR[r.severity] ?? '#fff', fontSize: '0.75rem' }}>
                        {r.count}
                      </Typography>
                      <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.65rem', width: 32, textAlign: 'right' }}>
                        {Math.round(r.count / sevTotal * 100)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Card>
        </Grid>

        {/* 도메인별 인시던트 총량 — 수평 바 (dlgt_unit_svc = KOS-도메인 단위) */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardTitle>도메인별 인시던트 총량</CardTitle>
            {!hasService ? (
              <EmptyState message={`${periodLabel} 인시던트 없음`} />
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={serviceRanking}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="serviceName"
                    tick={{ fill: C.muted, fontSize: 11 }}
                    width={90}
                    tickFormatter={(v: string) => v.replace('KOS-', '')}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { serviceName: string; count: number };
                      return (
                        <Box sx={{ backgroundColor: '#0F172A', border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1.25 }}>
                          <Typography variant="caption" sx={{ color: '#fff' }}>{d.serviceName}: <strong>{d.count}건</strong></Typography>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={14}>
                    {serviceRanking.map((_: unknown, i: number) => (
                      <Cell key={i} fill={`hsl(${240 - i * 30}, 70%, ${60 - i * 4}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* 알람 검출기준별 분포 (detect_type) */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardTitle>알람 검출기준</CardTitle>
            {!hasDetect ? (
              <EmptyState message={`${periodLabel} 인시던트 없음`} />
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={detectTypeCounts} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { label: string; count: number };
                      return (
                        <Box sx={{ backgroundColor: '#0F172A', border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1.25 }}>
                          <Typography variant="caption" sx={{ color: '#fff' }}>{d.label}: <strong>{d.count}건</strong></Typography>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {detectTypeCounts.map((_: unknown, i: number) => (
                      <Cell key={i} fill={DETECT_COLORS[i % DETECT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── 차트 Row 2: 추이 + 최근 Fatal·Critical 목록 ── */}
      <Grid container spacing={2} alignItems="stretch">

        {/* 인시던트 추이 — 오늘: 시간대별 / 그 외: 일별 */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <CardTitle>{isToday ? '시간대별 인시던트 추이' : '일별 인시던트 추이'}</CardTitle>
              {isToday && (
                <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.62rem', mb: 2 }}>
                  00시 ~ {dayjs().format('HH')}시 · {dayjs().format('HH:mm')} 갱신
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, minHeight: 220 }}>
              {isToday ? (
                isHourlyLoading || !hourlyData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : !hasHourly ? (
                  <EmptyState message="오늘 발생한 인시던트 없음" height="100%" />
                ) : (
                  <SeverityTrendChart data={hourlyRows} xKey="hour" interval={1} />
                )
              ) : (
                <SeverityTrendChart
                  data={dailyTrendDense}
                  xKey="date"
                  interval={Math.max(0, Math.floor(dailyTrendDense.length / 8))}
                  tickFormatter={(v: string) => (typeof v === 'string' && v.length >= 10 ? v.slice(5) : v)}
                />
              )}
            </Box>
          </Card>
        </Grid>

        {/* 최근 Fatal·Critical 인시던트 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardTitle>최근 Fatal·Critical 인시던트</CardTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              {recentCritical.length === 0 ? (
                <EmptyState message="활성 인시던트 없음" height="100%" />
              ) : recentCritical.map((inc: { id: string; alarmHstSeq: string; serviceName: string; alarmName: string; thresholdValue: number; threshold: number; occurredAt: string; severity?: string }) => {
                const isFatal = inc.severity === 'fatal';
                const accentColor = isFatal ? C.fatal : C.critical;
                return (
                  <Box
                    key={inc.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      backgroundColor: isFatal ? '#7F1D1D18' : '#DC262608',
                      border: `1px solid ${accentColor}30`,
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {isFatal && (
                          <Typography variant="caption" sx={{ color: C.fatal, fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.04em' }}>
                            FATAL
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700, fontSize: '0.65rem' }}>
                          {inc.serviceName}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.62rem', whiteSpace: 'nowrap', ml: 1 }}>
                        {dayjs(inc.occurredAt).fromNow()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.7rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {inc.alarmName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                      <Chip
                        label={`${inc.thresholdValue.toLocaleString()}건`}
                        size="small"
                        sx={{ height: 16, fontSize: '0.6rem', backgroundColor: `${accentColor}22`, color: accentColor, '& .MuiChip-label': { px: 0.75 } }}
                      />
                      <Typography variant="caption" sx={{ color: C.muted, fontSize: '0.6rem' }}>
                        임계 {inc.threshold.toLocaleString()}건
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
}
