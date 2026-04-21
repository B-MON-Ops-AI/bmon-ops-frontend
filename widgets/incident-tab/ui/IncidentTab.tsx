'use client';

/**
 * @file IncidentTab.tsx
 * @description 인시던트 탭 위젯 (필터, 정렬, 목록, 상세 드로어)
 * @module widgets/incident-tab/ui
 */

import { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import LayersIcon from '@mui/icons-material/Layers';
import { IncidentWallCard, IncidentDetailDrawer, useIncidents } from '@/features/incidents';
import type { Incident, Severity } from '@/entities/incident';
import dayjs from 'dayjs';

// ── 필터 정의 ───────────────────────────────────────────

type SeverityFilter = Severity | 'all';
type ResolvedFilter = 'all' | 'unresolved' | 'resolved';
type SortOrder = 'newest' | 'severity';

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string; color: string | null }[] = [
  { value: 'all',      label: '전체',     color: null },
  { value: 'fatal',    label: 'Fatal',    color: '#7C1515' },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
  { value: 'major',    label: 'Major',    color: '#F59E0B' },
  { value: 'minor',    label: 'Minor',    color: '#3B82F6' },
];

const RESOLVED_OPTIONS: { value: ResolvedFilter; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'unresolved', label: '미해결' },
  { value: 'resolved',   label: '해결됨' },
];

export type DatePreset = 'today' | '3d' | '7d' | '30d' | 'custom';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: '3d',    label: '3일' },
  { value: '7d',    label: '7일' },
  { value: '30d',   label: '30일' },
  { value: 'custom', label: '직접입력' },
];

export function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string) {
  if (preset === 'custom') {
    return { from_date: customFrom, to_date: customTo };
  }
  const to = dayjs().format('YYYY-MM-DD');
  const daysMap: Record<string, number> = { today: 0, '3d': 2, '7d': 6, '30d': 29 };
  const from = dayjs().subtract(daysMap[preset] ?? 0, 'day').format('YYYY-MM-DD');
  return { from_date: from, to_date: to };
}

export interface IncidentTabDateProps {
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  onDatePresetChange: (preset: DatePreset) => void;
  onCustomFromChange: (from: string) => void;
  onCustomToChange: (to: string) => void;
}

const SEVERITY_ORDER: Record<string, number> = { fatal: 0, critical: 1, major: 2, minor: 3 };

/** 30분 이내 발생한 인시던트를 신규로 표시 */
const NEW_THRESHOLD_MINUTES = 30;

// ── 심각도 필터 칩 ──────────────────────────────────────

function SeverityFilterChip({
  option, selected, count, onClick,
}: {
  option: typeof SEVERITY_OPTIONS[number];
  selected: boolean;
  count: number;
  onClick: () => void;
}) {
  const { color } = option;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75,
        px: 1.5, py: 0.625,
        borderRadius: '20px',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: selected && color ? `${color}1a` : selected ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid',
        borderColor: selected ? (color ?? 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)',
        color: selected ? (color ?? 'text.primary') : 'text.disabled',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: color ?? 'rgba(255,255,255,0.3)',
          color: color ?? 'text.primary',
          backgroundColor: color ? `${color}0d` : 'rgba(255,255,255,0.05)',
        },
      }}
    >
      {color && (
        <Box
          sx={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: color,
            opacity: selected ? 1 : 0.5,
            boxShadow: selected ? `0 0 6px ${color}` : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      )}
      <Typography
        variant="caption"
        fontWeight={selected ? 700 : 400}
        sx={{ lineHeight: 1, color: 'inherit' }}
      >
        {option.label}
      </Typography>
      {option.value !== 'all' && count > 0 && (
        <Box
          sx={{
            minWidth: 18, height: 18, px: 0.5,
            borderRadius: '9px',
            backgroundColor: selected && color ? color : 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ fontSize: '0.6rem', lineHeight: 1, color: selected && color ? '#fff' : 'text.secondary' }}
          >
            {count}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ── 해결여부 세그먼트 ───────────────────────────────────

function ResolvedSegment({
  value, onChange,
}: {
  value: ResolvedFilter;
  onChange: (v: ResolvedFilter) => void;
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: '#1F2937',
        overflow: 'hidden',
        p: '3px',
        gap: '2px',
      }}
    >
      {RESOLVED_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              px: 1.75, py: 0.5,
              borderRadius: '7px',
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: selected ? (
                opt.value === 'resolved'
                  ? '#10B98133'
                  : opt.value === 'unresolved'
                  ? '#EF444422'
                  : 'rgba(255,255,255,0.1)'
              ) : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: selected ? undefined : 'rgba(255,255,255,0.06)',
              },
            }}
          >
            <Typography
              variant="caption"
              fontWeight={selected ? 700 : 400}
              sx={{
                lineHeight: 1,
                color: selected
                  ? opt.value === 'resolved'
                    ? '#10B981'
                    : opt.value === 'unresolved'
                    ? '#EF4444'
                    : 'text.primary'
                  : 'text.disabled',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── 정렬 세그먼트 ──────────────────────────────────────

function SortSegment({
  value, onChange,
}: {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
}) {
  const options: { value: SortOrder; label: string }[] = [
    { value: 'newest',   label: '최신순' },
    { value: 'severity', label: '위험도순' },
  ];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: '#1F2937',
        overflow: 'hidden',
        p: '3px',
        gap: '2px',
      }}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              px: 1.75, py: 0.5,
              borderRadius: '7px',
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: selected ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: selected ? undefined : 'rgba(255,255,255,0.06)',
              },
            }}
          >
            <Typography
              variant="caption"
              fontWeight={selected ? 700 : 400}
              sx={{ lineHeight: 1, color: selected ? 'text.primary' : 'text.disabled', whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────

export default function IncidentTab({
  datePreset,
  customFrom,
  customTo,
  onDatePresetChange,
  onCustomFromChange,
  onCustomToChange,
}: IncidentTabDateProps) {
  const [severity, setSeverity]       = useState<SeverityFilter>('all');
  const [resolved, setResolved]       = useState<ResolvedFilter>('unresolved');
  const [sortOrder, setSortOrder]     = useState<SortOrder>('newest');
  const [selected, setSelected]       = useState<Incident | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [groupByService, setGroupByService] = useState(false);

  // 400ms 디바운스: 타이핑 중에는 API 호출 안 함
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const statusParam =
    resolved === 'resolved' ? 'resolved' :
    resolved === 'unresolved' ? 'open' :
    undefined;

  const dateRange = getDateRange(datePreset, customFrom, customTo);

  const { data, isLoading } = useIncidents({
    severity: severity === 'all' ? undefined : severity,
    status: statusParam,
    from_date: dateRange.from_date,
    to_date: dateRange.to_date,
    search: search || undefined,
  });

  const allIncidents = data?.incidents ?? [];

  // 해결 상태 클라이언트 보정
  const filtered = resolved === 'unresolved'
    ? allIncidents.filter((i) => i.status !== 'resolved')
    : allIncidents;

  // 필터링된 인시던트 정렬
  const incidents = useMemo(() => {
    const copy = [...filtered];
    if (sortOrder === 'newest') {
      copy.sort((a, b) => dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf());
    } else {
      copy.sort((a, b) => {
        const sev = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
        if (sev !== 0) return sev;
        return dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf();
      });
    }
    return copy;
  }, [filtered, sortOrder]);

  // 최근 30분 이내 신규 인시던트 건수
  const newCount = incidents.filter(
    (i) => dayjs().diff(dayjs(i.occurredAt), 'minute') < NEW_THRESHOLD_MINUTES
  ).length;

  // 심각도별 건수 집계
  const severityCounts: Record<string, number> = {
    fatal:    allIncidents.filter((i) => i.severity === 'fatal').length,
    critical: allIncidents.filter((i) => i.severity === 'critical').length,
    major:    allIncidents.filter((i) => i.severity === 'major').length,
    minor:    allIncidents.filter((i) => i.severity === 'minor').length,
  };

  const criticalIncidents = incidents.filter((i) => i.severity === 'fatal' || i.severity === 'critical');
  const otherIncidents    = incidents.filter((i) => i.severity !== 'fatal' && i.severity !== 'critical');

  // 단위서비스별 그룹핑 (건수 내림차순)
  const serviceGroups = useMemo(() => {
    if (!groupByService) return null;
    const map = new Map<string, { serviceName: string; incidents: Incident[] }>();
    for (const i of incidents) {
      if (!map.has(i.serviceId)) {
        map.set(i.serviceId, { serviceName: i.serviceName, incidents: [] });
      }
      map.get(i.serviceId)!.incidents.push(i);
    }
    return Array.from(map.entries()).sort(
      (a, b) => b[1].incidents.length - a[1].incidents.length
    );
  }, [incidents, groupByService]);

  return (
    <>
      <Box>
        {/* 신규 인시던트 배너 */}
        {!isLoading && newCount > 0 && (
          <Box
            sx={{
              mb: 2, px: 2, py: 1.25,
              borderRadius: 1.5,
              backgroundColor: '#10B98110',
              border: '1px solid #10B98133',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981', flexShrink: 0 }} />
            <Typography variant="body2" color="success.main" fontWeight={600}>
              최근 30분 내 신규 인시던트
            </Typography>
            <Chip
              label={`${newCount}건`}
              size="small"
              sx={{ backgroundColor: '#10B981', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20 }}
            />
            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
              NEW 배지로 표시됩니다
            </Typography>
          </Box>
        )}

        {/* 필터 바 */}
        <Box
          sx={{
            mb: 3, p: 2,
            borderRadius: 2,
            backgroundColor: '#1a2233',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.75,
          }}
        >
          {/* 심각도 + 기간 한 줄 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            {/* 심각도 — 왼쪽 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={600}
                sx={{ flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                심각도
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SeverityFilterChip
                    key={opt.value}
                    option={opt}
                    selected={severity === opt.value}
                    count={opt.value !== 'all' ? (severityCounts[opt.value] ?? 0) : 0}
                    onClick={() => setSeverity(opt.value)}
                  />
                ))}
              </Box>
            </Box>

            {/* 기간 — 오른쪽 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={600}
                sx={{ flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                기간
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#1F2937',
                  overflow: 'hidden',
                  p: '3px',
                  gap: '2px',
                }}
              >
                {DATE_PRESETS.map((opt) => {
                  const sel = datePreset === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      onClick={() => onDatePresetChange(opt.value)}
                      sx={{
                        px: 1.75, py: 0.5,
                        borderRadius: '7px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        backgroundColor: sel ? 'rgba(99,102,241,0.2)' : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { backgroundColor: sel ? undefined : 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={sel ? 700 : 400}
                        sx={{ lineHeight: 1, color: sel ? '#818CF8' : 'text.disabled', whiteSpace: 'nowrap' }}
                      >
                        {opt.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {datePreset === 'custom' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    type="date"
                    size="small"
                    value={customFrom}
                    onChange={(e) => onCustomFromChange(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#1F2937', fontSize: '0.75rem', height: 32 }, width: 140 }}
                    inputProps={{ style: { padding: '4px 8px' } }}
                  />
                  <Typography variant="caption" color="text.disabled">~</Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={customTo}
                    onChange={(e) => onCustomToChange(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#1F2937', fontSize: '0.75rem', height: 32 }, width: 140 }}
                    inputProps={{ style: { padding: '4px 8px' } }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* 구분선 */}
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* 검색 행 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              fontWeight={600}
              sx={{ width: 52, flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              검색
            </Typography>
            <TextField
              size="small"
              placeholder="알람명 또는 서비스명 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{
                flex: 1,
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1F2937',
                  fontSize: '0.8rem',
                  height: 34,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => { setSearchInput(''); setSearch(''); }}
                      sx={{ p: 0.25 }}
                    >
                      <ClearIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {search && (
              <Typography variant="caption" color="primary.light" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                &quot;{search}&quot; 검색 중
              </Typography>
            )}
          </Box>

          {/* 구분선 */}
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* 해결여부 + 정렬 + 그룹핑 행 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={600}
                sx={{ width: 52, flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                해결여부
              </Typography>
              <ResolvedSegment value={resolved} onChange={setResolved} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* 단위서비스 그룹핑 토글 */}
              <Tooltip title={groupByService ? '서비스별 그룹 해제' : '단위서비스별 그룹핑'}>
                <Box
                  onClick={() => setGroupByService((v) => !v)}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    px: 1.5, py: 0.625,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: '1px solid',
                    borderColor: groupByService ? '#6366F1' : 'rgba(255,255,255,0.1)',
                    backgroundColor: groupByService ? 'rgba(99,102,241,0.15)' : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: '#6366F1',
                      backgroundColor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  <LayersIcon sx={{ fontSize: 14, color: groupByService ? '#818CF8' : 'text.disabled' }} />
                  <Typography
                    variant="caption"
                    fontWeight={groupByService ? 700 : 400}
                    sx={{ lineHeight: 1, color: groupByService ? '#818CF8' : 'text.disabled', whiteSpace: 'nowrap' }}
                  >
                    서비스별
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip title="인시던트 정렬 기준">
                <Box>
                  <SortSegment value={sortOrder} onChange={setSortOrder} />
                </Box>
              </Tooltip>
              {!isLoading && (
                <Typography variant="caption" color="text.disabled">
                  {incidents.length}건
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* 인시던트 목록 */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : incidents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="text.secondary">조건에 맞는 인시던트가 없습니다.</Typography>
          </Box>
        ) : serviceGroups ? (
          // ── 단위서비스별 그룹핑 뷰 ──────────────────────
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {serviceGroups.map(([serviceId, { serviceName, incidents: svcIncidents }]) => {
              const hasCritical = svcIncidents.some((i) => i.severity === 'fatal' || i.severity === 'critical');
              return (
                <Box key={serviceId}>
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
                      pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {hasCritical && (
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#DC2626', boxShadow: '0 0 6px #DC2626', flexShrink: 0 }} />
                    )}
                    <Typography variant="subtitle2" fontWeight={700} color={hasCritical ? 'error.light' : 'text.primary'}>
                      ({serviceId}) {serviceName}
                    </Typography>
                    <Chip
                      label={`${svcIncidents.length}건`}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 700,
                        backgroundColor: hasCritical ? '#DC262622' : 'rgba(255,255,255,0.08)',
                        color: hasCritical ? '#EF4444' : 'text.secondary',
                        border: '1px solid',
                        borderColor: hasCritical ? '#DC262644' : 'rgba(255,255,255,0.12)',
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    {svcIncidents.map((incident) => (
                      <Grid key={incident.id} item xs={12} sm={6} md={4} lg={3}>
                        <IncidentWallCard incident={incident} onClick={setSelected} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        ) : sortOrder === 'severity' ? (
          // 위험도순 정렬: Critical 그룹 강조 표시
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {criticalIncidents.length > 0 && (
              <Box
                sx={{
                  p: 2.5, borderRadius: 2,
                  backgroundColor: '#DC262608',
                  border: '1px solid #DC262633',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#DC2626', boxShadow: '0 0 8px #DC2626' }} />
                  <Typography variant="subtitle2" color="error.main" fontWeight={700}>Critical</Typography>
                  <Typography variant="caption" color="error.light">({criticalIncidents.length})</Typography>
                </Box>
                <Grid container spacing={2}>
                  {criticalIncidents.map((incident) => (
                    <Grid key={incident.id} item xs={12} sm={6} md={4}>
                      <IncidentWallCard incident={incident} onClick={setSelected} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {otherIncidents.length > 0 && (
              <Box>
                {criticalIncidents.length > 0 && (
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    기타 인시던트 ({otherIncidents.length})
                  </Typography>
                )}
                <Grid container spacing={2}>
                  {otherIncidents.map((incident) => (
                    <Grid key={incident.id} item xs={12} sm={6} md={4} lg={3}>
                      <IncidentWallCard incident={incident} onClick={setSelected} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        ) : (
          // 최신순 정렬: NEW 배지가 상단에 표시
          <Grid container spacing={2}>
            {incidents.map((incident) => (
              <Grid key={incident.id} item xs={12} sm={6} md={4} lg={3}>
                <IncidentWallCard incident={incident} onClick={setSelected} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <IncidentDetailDrawer incident={selected} onClose={() => setSelected(null)} />
    </>
  );
}
