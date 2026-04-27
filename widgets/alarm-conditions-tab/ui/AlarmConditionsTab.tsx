'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import ReactMarkdown from 'react-markdown';
import { useAlarmConditions } from '@/features/alarm-conditions';
import { useSendChat } from '@/features/chat';
import type { AlarmCondition, AlarmLevel, TriggerStatus } from '@/entities/alarm-condition';
import AlarmConditionDetailDrawer from './AlarmConditionDetailDrawer';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// ── 상수 ──────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<AlarmLevel, { label: string; color: string; bg: string }> = {
  Critical: { label: 'Critical', color: '#F87171', bg: 'rgba(239,68,68,0.1)' },
  Major:    { label: 'Major',    color: '#FB923C', bg: 'rgba(249,115,22,0.1)' },
  Minor:    { label: 'Minor',    color: '#FBBF24', bg: 'rgba(245,158,11,0.1)' },
};

const TRIGGER_CONFIG: Record<TriggerStatus, { label: string; color: string; bg: string; desc: string }> = {
  'no-trigger': { label: '미발생', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', desc: '30일간 발생 없음 — 임계값 검토 필요' },
  'normal':     { label: '정상',   color: '#34D399', bg: 'rgba(52,211,153,0.1)',  desc: '정상 범위 내 발생' },
  'frequent':   { label: '빈발',   color: '#FB923C', bg: 'rgba(249,115,22,0.1)',  desc: '발생 빈도 높음 — 임계값 재검토 권장' },
  'excessive':  { label: '과다',   color: '#F87171', bg: 'rgba(239,68,68,0.1)',   desc: '과다 발생 — 임계값이 너무 낮거나 알람 노이즈' },
};

const DETECT_TYPE_LABEL: Record<string, string> = {
  ERR_S: '시스템오류', ERR_E: '외부오류', ERR_RATE: '오류율(%)',
  RPY_TIME: '응답시간(ms)', CALL_CASCNT: '호출건수',
};

const DETECT_TERM_LABEL: Record<string, string> = {
  MIN1: '1분', MIN5: '5분', MIN10: '10분', MIN30: '30분', HOUR1: '1시간', DAY1: '1일',
};

const SERVICES = [
  { id: 'all', label: '전체 서비스' },
  { id: 'BG011701', label: 'KOS-무선오더' },
  { id: 'BG011706', label: 'KOS-유선공통' },
  { id: 'BG008802', label: 'KOS-요금온라인' },
  { id: 'BG008702', label: 'KOS-통합고객' },
  { id: 'BG009102', label: 'KOS-B2C CRM' },
  { id: 'BG009201', label: 'KOS-B2B CRM' },
  { id: 'BG009001', label: 'KOS-물류' },
];

type SortKey = 'triggerCount30d' | 'alarmLevel' | 'serviceName' | 'alarmName';
type SortDir = 'asc' | 'desc';
const LEVEL_ORDER: Record<AlarmLevel, number> = { Critical: 0, Major: 1, Minor: 2 };

// ── 서비스 이니셜 아바타 ──────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  BG011701: '#6366F1', BG011706: '#8B5CF6', BG008802: '#EC4899',
  BG008702: '#14B8A6', BG009102: '#F59E0B', BG009201: '#3B82F6', BG009001: '#10B981',
};

function ServiceAvatar({ serviceId, serviceName }: { serviceId: string; serviceName: string }) {
  const color = SERVICE_COLORS[serviceId] ?? '#6366F1';
  const initial = serviceName.replace('KOS-', '').charAt(0);
  return (
    <Box sx={{
      width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
      backgroundColor: `${color}22`,
      border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color }}>{initial}</Typography>
    </Box>
  );
}

// ── 요약 스탯 카드 ────────────────────────────────────────────

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Box sx={{
      flex: 1, px: 2, py: 1.5,
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 2,
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</Typography>
      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.4 }}>{label}</Typography>
    </Box>
  );
}

// ── Pill 토글 그룹 ────────────────────────────────────────────

interface PillOption { value: string; label: string; color?: string }

function PillGroup({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: PillOption[];
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled', mr: 0.25, whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      {options.map((opt) => {
        const active = value === opt.value;
        const ac = opt.color ?? '#818CF8';
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              px: 1.25, py: 0.35,
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: active ? 600 : 400,
              backgroundColor: active ? `${ac}22` : 'rgba(255,255,255,0.03)',
              color: active ? ac : 'rgba(255,255,255,0.35)',
              border: `1px solid ${active ? `${ac}55` : 'rgba(255,255,255,0.07)'}`,
              cursor: 'pointer',
              userSelect: 'none' as const,
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: active ? `${ac}28` : 'rgba(255,255,255,0.06)',
                color: active ? ac : 'rgba(255,255,255,0.6)',
                borderColor: active ? `${ac}55` : 'rgba(255,255,255,0.14)',
              },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}

// ── AI 의견 패널 ──────────────────────────────────────────────

function AiPanel({ loading, content }: { loading: boolean; content: string | null }) {
  return (
    <Box sx={{
      mt: 0, mx: 0, mb: 0,
      px: 3, py: 2,
      borderTop: '1px solid rgba(99,102,241,0.15)',
      backgroundColor: 'rgba(99,102,241,0.04)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ fontSize: 13, color: '#818CF8' }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#818CF8', letterSpacing: '0.04em' }}>
          AI 분석 의견
        </Typography>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={12} sx={{ color: '#818CF8' }} />
          <Typography sx={{ fontSize: '0.73rem', color: 'text.disabled' }}>분석 중...</Typography>
        </Box>
      ) : content ? (
        <Box sx={{
          fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.75,
          '& p': { m: 0, mb: 0.5 }, '& ul, & ol': { pl: 2, my: 0.5 },
          '& li': { mb: 0.25 }, '& strong': { color: 'text.primary', fontWeight: 600 },
          '& h2, & h3': { fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', mt: 1, mb: 0.5 },
        }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      ) : null}
    </Box>
  );
}

// ── 알람 카드 행 ──────────────────────────────────────────────

interface CardRowProps {
  cond: AlarmCondition;
  aiLoading: boolean;
  aiContent: string | null;
  onRequestAi: (cond: AlarmCondition) => void;
  onClick: () => void;
}

function AlarmConditionCard({ cond, aiLoading, aiContent, onRequestAi, onClick }: CardRowProps) {
  const lc = LEVEL_CONFIG[cond.alarmLevel];
  const tc = TRIGGER_CONFIG[cond.triggerStatus];
  const isInactive = cond.useYn === 'N';
  const canRequestAi = cond.triggerStatus === 'no-trigger' && cond.useYn === 'Y';
  const aiOpen = aiLoading || !!aiContent;

  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 2,
        mb: 1,
        opacity: isInactive ? 0.55 : 1,
        transition: 'border-color 0.15s, background-color 0.15s',
        cursor: 'pointer',
        '&:hover': { borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.045)' },
        overflow: 'hidden',
      }}
    >
      {/* 메인 행 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5 }}>

        {/* 서비스 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: 155, flexShrink: 0 }}>
          <ServiceAvatar serviceId={cond.serviceId} serviceName={cond.serviceName} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }} noWrap>
              {cond.serviceName.replace('KOS-', '')}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1.2 }}>
              {cond.serviceId}
            </Typography>
          </Box>
        </Box>

        {/* 알람명 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={cond.alarmName} placement="top-start">
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }} noWrap>
              {cond.alarmName}
            </Typography>
          </Tooltip>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', lineHeight: 1.2 }}>
            {DETECT_TYPE_LABEL[cond.detectType] ?? cond.detectType} · {DETECT_TERM_LABEL[cond.detectTerm] ?? cond.detectTerm} · 임계 {cond.threshold.toLocaleString()}
          </Typography>
        </Box>

        {/* 등급 */}
        <Box sx={{ width: 72, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <Chip label={lc.label} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 700,
            backgroundColor: lc.bg, color: lc.color,
            border: `1px solid ${lc.color}33`,
            '& .MuiChip-label': { px: 1 },
          }} />
        </Box>

        {/* 활성 */}
        <Box sx={{ width: 60, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={cond.useYn === 'Y' ? '활성' : '비활성'}
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 600,
              backgroundColor: cond.useYn === 'Y' ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.08)',
              color: cond.useYn === 'Y' ? '#34D399' : '#64748B',
              border: `1px solid ${cond.useYn === 'Y' ? 'rgba(52,211,153,0.25)' : 'rgba(148,163,184,0.15)'}`,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        {/* 30일 발생 */}
        <Box sx={{ width: 72, flexShrink: 0, textAlign: 'right' }}>
          <Typography sx={{
            fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: cond.triggerCount30d > 30 ? '#F87171' : cond.triggerCount30d > 10 ? '#FB923C' : cond.triggerCount30d === 0 ? '#64748B' : 'text.primary',
          }}>
            {cond.triggerCount30d}<Typography component="span" sx={{ fontSize: '0.62rem', fontWeight: 400, ml: 0.25 }}>건</Typography>
          </Typography>
          {cond.unresolvedCount > 0 && (
            <Typography sx={{ fontSize: '0.6rem', color: '#F87171', lineHeight: 1 }}>미해소 {cond.unresolvedCount}</Typography>
          )}
        </Box>

        {/* 발생상태 */}
        <Box sx={{ width: 68, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={tc.desc} placement="top">
            <Chip label={tc.label} size="small" sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 700,
              backgroundColor: tc.bg, color: tc.color,
              border: `1px solid ${tc.color}33`,
              cursor: 'default', '& .MuiChip-label': { px: 1 },
            }} />
          </Tooltip>
        </Box>

        {/* 최근 발생 */}
        <Box sx={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.7rem', color: cond.latestTriggerAt ? 'text.secondary' : 'text.disabled' }}>
            {cond.latestTriggerAt ? dayjs(cond.latestTriggerAt).fromNow() : '—'}
          </Typography>
        </Box>

        {/* AI 버튼 */}
        <Box sx={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          {canRequestAi && (
            <Tooltip title={aiContent ? 'AI 의견 다시 요청' : 'AI 의견 요청'} placement="top">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onRequestAi(cond); }}
                disabled={aiLoading}
                sx={{
                  p: 0.5,
                  color: aiOpen ? '#818CF8' : '#6366F1',
                  backgroundColor: aiOpen ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${aiOpen ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 1,
                  '&:hover': { color: '#A5B4FC', backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.45)' },
                }}
              >
                {aiLoading
                  ? <CircularProgress size={12} sx={{ color: '#818CF8' }} />
                  : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* AI 의견 패널 */}
      <Collapse in={aiOpen} unmountOnExit>
        <AiPanel loading={aiLoading} content={aiContent} />
      </Collapse>
    </Box>
  );
}

// ── 컬럼 헤더 ──────────────────────────────────────────────────

function ColumnHeaders({ sortKey, sortDir, onSort }: {
  sortKey: SortKey; sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <KeyboardArrowDownIcon sx={{ fontSize: 13, opacity: 0.3 }} />;
    return sortDir === 'asc'
      ? <KeyboardArrowUpIcon sx={{ fontSize: 13, color: '#818CF8' }} />
      : <KeyboardArrowDownIcon sx={{ fontSize: 13, color: '#818CF8' }} />;
  };

  const colSx = { fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', userSelect: 'none' as const };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 0.75, mb: 0.5 }}>
      <Box sx={{ width: 155, flexShrink: 0 }} onClick={() => onSort('serviceName')}>
        <Typography sx={colSx}>서비스 <SortIcon k="serviceName" /></Typography>
      </Box>
      <Box sx={{ flex: 1 }} onClick={() => onSort('alarmName')}>
        <Typography sx={colSx}>알람명 <SortIcon k="alarmName" /></Typography>
      </Box>
      <Box sx={{ width: 72, flexShrink: 0, display: 'flex', justifyContent: 'center' }} onClick={() => onSort('alarmLevel')}>
        <Typography sx={colSx}>등급 <SortIcon k="alarmLevel" /></Typography>
      </Box>
      <Box sx={{ width: 60, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <Typography sx={{ ...colSx, cursor: 'default' }}>활성</Typography>
      </Box>
      <Box sx={{ width: 72, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }} onClick={() => onSort('triggerCount30d')}>
        <Typography sx={colSx}>30일 발생 <SortIcon k="triggerCount30d" /></Typography>
      </Box>
      <Box sx={{ width: 68, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <Typography sx={{ ...colSx, cursor: 'default' }}>상태</Typography>
      </Box>
      <Box sx={{ width: 80, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography sx={{ ...colSx, cursor: 'default' }}>최근 발생</Typography>
      </Box>
      <Box sx={{ width: 32, flexShrink: 0 }} />
    </Box>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function AlarmConditionsTab() {
  const { data, isLoading } = useAlarmConditions();
  const { mutate: sendChat } = useSendChat();

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('triggerCount30d');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [aiState, setAiState] = useState<Record<string, { loading: boolean; content: string | null }>>({});
  const [selectedCond, setSelectedCond] = useState<AlarmCondition | null>(null);

  const conditions = data?.conditions ?? [];

  const filtered = useMemo(() => {
    let list = conditions;
    if (search) list = list.filter((c) => c.alarmName.includes(search) || c.serviceName.includes(search));
    if (serviceFilter !== 'all') list = list.filter((c) => c.serviceId === serviceFilter);
    if (levelFilter !== 'all') list = list.filter((c) => c.alarmLevel === levelFilter);
    if (activeFilter !== 'all') list = list.filter((c) => c.useYn === activeFilter);
    if (triggerFilter !== 'all') list = list.filter((c) => c.triggerStatus === triggerFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'triggerCount30d') cmp = a.triggerCount30d - b.triggerCount30d;
      else if (sortKey === 'alarmLevel') cmp = LEVEL_ORDER[a.alarmLevel] - LEVEL_ORDER[b.alarmLevel];
      else if (sortKey === 'serviceName') cmp = a.serviceName.localeCompare(b.serviceName);
      else if (sortKey === 'alarmName') cmp = a.alarmName.localeCompare(b.alarmName);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [conditions, search, serviceFilter, levelFilter, activeFilter, triggerFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleRequestAi = (cond: AlarmCondition) => {
    setAiState((prev) => ({ ...prev, [cond.alarmId]: { loading: true, content: null } }));
    const query = [
      '[알람조건분석]',
      `서비스: ${cond.serviceName}(${cond.serviceId})`,
      `알람명: ${cond.alarmName}`,
      `등급: ${cond.alarmLevel}`,
      `검출유형: ${cond.detectType}(${DETECT_TYPE_LABEL[cond.detectType] ?? cond.detectType})`,
      `임계값: ${cond.threshold.toLocaleString()}건/${DETECT_TERM_LABEL[cond.detectTerm] ?? cond.detectTerm}`,
      '이 알람이 최근 30일간 한 번도 발생하지 않았습니다. 원인 추정과 개선 방안을 제안해주세요.',
    ].join(' | ');

    sendChat(
      { query, session_id: `alarm-cond-${cond.alarmId}` },
      {
        onSuccess: (res) =>
          setAiState((prev) => ({ ...prev, [cond.alarmId]: { loading: false, content: res.answer.summary } })),
        onError: () =>
          setAiState((prev) => ({ ...prev, [cond.alarmId]: { loading: false, content: '분석 중 오류가 발생했습니다.' } })),
      }
    );
  };

  const noTriggerCount = conditions.filter((c) => c.triggerStatus === 'no-trigger' && c.useYn === 'Y').length;
  const frequentCount = conditions.filter((c) => c.triggerStatus === 'frequent' || c.triggerStatus === 'excessive').length;
  const inactiveCount = conditions.filter((c) => c.useYn === 'N').length;

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* ── 요약 스탯 ── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        <StatCard label="전체 알람조건" count={conditions.length} color="#818CF8" />
        <StatCard label="30일 미발생"   count={noTriggerCount}    color="#94A3B8" />
        <StatCard label="빈발 / 과다"   count={frequentCount}     color="#F87171" />
        <StatCard label="비활성"        count={inactiveCount}     color="#475569" />
      </Box>

      {/* ── 검색 + 서비스 ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.25, alignItems: 'center' }}>
        <TextField
          placeholder="알람명 또는 서비스명 검색..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
          }}
          sx={{
            flex: 1, maxWidth: 300,
            '& .MuiInputBase-input': { fontSize: '0.78rem' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99,102,241,0.5)' },
          }}
        />
        <Select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          size="small"
          displayEmpty
          sx={{
            fontSize: '0.78rem', minWidth: 140,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
          }}
        >
          {SERVICES.map((s) => <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.78rem' }}>{s.label}</MenuItem>)}
        </Select>
        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {filtered.length}건
        </Typography>
      </Box>

      {/* ── Pill 필터 ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
        px: 1.5, py: 1, borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap',
      }}>
        <PillGroup
          label="등급"
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            { value: 'all',      label: '전체' },
            { value: 'Critical', label: 'Critical', color: '#F87171' },
            { value: 'Major',    label: 'Major',    color: '#FB923C' },
            { value: 'Minor',    label: 'Minor',    color: '#FBBF24' },
          ]}
        />
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
        <PillGroup
          label="활성"
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: 'all', label: '전체' },
            { value: 'Y',   label: '활성',   color: '#34D399' },
            { value: 'N',   label: '비활성', color: '#64748B' },
          ]}
        />
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
        <PillGroup
          label="발생상태"
          value={triggerFilter}
          onChange={setTriggerFilter}
          options={[
            { value: 'all',        label: '전체' },
            { value: 'no-trigger', label: '미발생', color: '#94A3B8' },
            { value: 'normal',     label: '정상',   color: '#34D399' },
            { value: 'frequent',   label: '빈발',   color: '#FB923C' },
            { value: 'excessive',  label: '과다',   color: '#F87171' },
          ]}
        />
      </Box>

      {/* ── 컬럼 헤더 ── */}
      <ColumnHeaders sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />

      {/* ── 카드 리스트 ── */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled', fontSize: '0.82rem' }}>
          조건에 맞는 알람이 없습니다.
        </Box>
      ) : (
        filtered.map((cond) => {
          const ai = aiState[cond.alarmId];
          return (
            <AlarmConditionCard
              key={cond.alarmId}
              cond={cond}
              aiLoading={!!ai?.loading}
              aiContent={ai?.content ?? null}
              onRequestAi={handleRequestAi}
              onClick={() => setSelectedCond(cond)}
            />
          );
        })
      )}

      <AlarmConditionDetailDrawer
        cond={selectedCond}
        onClose={() => setSelectedCond(null)}
        aiLoading={!!(selectedCond && aiState[selectedCond.alarmId]?.loading)}
        aiContent={selectedCond ? (aiState[selectedCond.alarmId]?.content ?? null) : null}
        onRequestAi={handleRequestAi}
      />
    </Box>
  );
}
