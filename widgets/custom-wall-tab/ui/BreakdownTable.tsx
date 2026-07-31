'use client';

/**
 * @file BreakdownTable.tsx
 * @description 처리량 상위 서비스 — 레거시 '호출 현황 목록' 스타일 정렬 데이터 테이블.
 *   variant로 두 용도를 분기한다:
 *   - 'monitor' : 현재창(bymi 이동창) 실측만 노출(정상/오류/응답/σ). 알람 아이콘은 '설계로 이동'.
 *   - 'design'  : byhr 최신일 시간대 peak(오류율·응답)만 노출 + 등록. 기간 토글과 무관.
 * @module widgets/custom-wall-tab/ui
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TableSortLabel from '@mui/material/TableSortLabel';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import type { DomainBreakdownItem } from '@/entities/dashboard';

export type BreakdownVariant = 'monitor' | 'design' | 'errrate' | 'errcount';

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

type SortKey =
  | 'name' | 'opName' | 'throughput' | 'dealD' | 'errS' | 'errE'
  | 'errorRateS' | 'errorRateE' | 'avgResponseMs' | 'maxResponseMs' | 'responseStdDev'
  | 'peakErrorRate' | 'peakMaxResponseMs' | 'errCount' | 'errorRate';
type SortDir = 'asc' | 'desc';

// 오류율/오류건수 정렬 접근자 (errCount·errorRate는 파생/nullable)
const sortVal = (b: DomainBreakdownItem, key: SortKey): number | string | null => {
  if (key === 'errCount') return b.errS + b.errE;
  if (key === 'errorRate') return b.errorRate;
  return (b as unknown as Record<SortKey, number | string | null>)[key];
};

interface Col {
  key: SortKey;
  label: string;
  align: 'left' | 'right';
  numeric: boolean;
  minWidth: number;
  tip?: string;
}

const PEAK_TIP = '최신일(byhr) 시간대 최고값 — 알람 임계 결정 기준';

// 공통 앞머리(서비스·OP)
const COL_NAME: Col = { key: 'name',   label: '서비스명', align: 'left', numeric: false, minWidth: 190 };
const COL_OP:   Col = { key: 'opName', label: 'OP',      align: 'left', numeric: false, minWidth: 130 };

// 모니터링: 현재창 실측 컬럼 (peak 없음)
const MONITOR_COLS: Col[] = [
  COL_NAME, COL_OP,
  { key: 'throughput',    label: '정상(I)',   align: 'right', numeric: true, minWidth: 78 },
  { key: 'dealD',         label: '정상(D)',   align: 'right', numeric: true, minWidth: 70 },
  { key: 'errS',          label: '오류(S)',   align: 'right', numeric: true, minWidth: 70 },
  { key: 'errE',          label: '오류(E)',   align: 'right', numeric: true, minWidth: 70 },
  { key: 'errorRateS',    label: '오류율(S)', align: 'right', numeric: true, minWidth: 76 },
  { key: 'errorRateE',    label: '오류율(E)', align: 'right', numeric: true, minWidth: 76 },
  { key: 'avgResponseMs', label: '평균',      align: 'right', numeric: true, minWidth: 66 },
  { key: 'maxResponseMs', label: '최대',      align: 'right', numeric: true, minWidth: 66 },
  { key: 'responseStdDev',label: 'σ',         align: 'right', numeric: true, minWidth: 60 },
];

// 알람 설계: byhr 최신일 시간대 peak 만
const DESIGN_COLS: Col[] = [
  COL_NAME, COL_OP,
  { key: 'peakErrorRate',     label: 'peak오류율', align: 'right', numeric: true, minWidth: 92, tip: PEAK_TIP },
  { key: 'peakMaxResponseMs', label: 'peak응답',   align: 'right', numeric: true, minWidth: 90, tip: PEAK_TIP },
];

// [모니터링] 오류율/오류건수 상위 — 현재창 실측 오류 중심 컬럼(정상 n 맥락 포함). 서버 사전 랭킹.
const ERROR_COLS: Col[] = [
  COL_NAME, COL_OP,
  { key: 'throughput', label: '정상(I)',  align: 'right', numeric: true, minWidth: 78 },
  { key: 'errS',       label: '오류(S)',  align: 'right', numeric: true, minWidth: 70 },
  { key: 'errE',       label: '오류(E)',  align: 'right', numeric: true, minWidth: 70 },
  { key: 'errCount',   label: '오류합',   align: 'right', numeric: true, minWidth: 74, tip: '시스템(S)+비즈니스(E) 오류 건수' },
  { key: 'errorRate',  label: '오류율',   align: 'right', numeric: true, minWidth: 78, tip: '(S+E)/전체 호출수' },
];

const cellSx = {
  px: 1, py: 0.9, fontSize: '0.7rem', whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
} as const;

// 컬럼 key → 셀 노드/정렬 렌더 (header·body 정합)
function renderCell(b: DomainBreakdownItem, key: SortKey): { node: React.ReactNode; sx: object } {
  switch (key) {
    case 'name':
      return {
        sx: { ...cellSx, maxWidth: 220 },
        node: (
          <Tooltip title={b.name} placement="top-start">
            <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'text.primary',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}>
              {b.name}
            </Typography>
          </Tooltip>
        ),
      };
    case 'opName':
      return {
        sx: { ...cellSx, maxWidth: 150 },
        node: (
          <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'text.disabled',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {b.opName || '—'}
          </Typography>
        ),
      };
    case 'throughput':
      return { sx: { ...cellSx, textAlign: 'right', fontWeight: 700, color: 'text.secondary' },
        node: b.throughput.toLocaleString() };
    case 'dealD':
      return { sx: { ...cellSx, textAlign: 'right', color: 'text.disabled' },
        node: b.dealD.toLocaleString() };
    case 'errS':
      return { sx: { ...cellSx, textAlign: 'right', color: b.errS > 0 ? '#F87171' : 'text.disabled' },
        node: b.errS.toLocaleString() };
    case 'errE':
      return { sx: { ...cellSx, textAlign: 'right', color: b.errE > 0 ? '#FB923C' : 'text.disabled' },
        node: b.errE.toLocaleString() };
    case 'errorRateS':
      return { sx: { ...cellSx, textAlign: 'right', color: b.errorRateS > 0 ? '#F87171' : 'text.disabled' },
        node: `${b.errorRateS.toFixed(2)}%` };
    case 'errorRateE':
      return { sx: { ...cellSx, textAlign: 'right', color: b.errorRateE > 0 ? '#FB923C' : 'text.disabled' },
        node: `${b.errorRateE.toFixed(2)}%` };
    case 'avgResponseMs':
      return { sx: { ...cellSx, textAlign: 'right', color: 'text.secondary' }, node: fmtMs(b.avgResponseMs) };
    case 'maxResponseMs':
      return { sx: { ...cellSx, textAlign: 'right', color: b.maxResponseMs >= 5000 ? '#FB923C' : 'text.secondary' },
        node: fmtMs(b.maxResponseMs) };
    case 'responseStdDev':
      return { sx: { ...cellSx, textAlign: 'right', color: 'text.disabled' }, node: fmtMs(b.responseStdDev) };
    case 'errCount': {
      const c = b.errS + b.errE;
      return { sx: { ...cellSx, textAlign: 'right', fontWeight: 700, color: c > 0 ? '#F87171' : 'text.disabled' },
        node: c.toLocaleString() };
    }
    case 'errorRate':
      return {
        sx: { ...cellSx, textAlign: 'right', fontWeight: 700,
          color: b.errorRate == null ? 'text.disabled'
            : b.errorRate >= 5 ? '#F87171' : b.errorRate >= 1 ? '#FB923C' : 'text.secondary' },
        node: b.errorRate == null ? '무오류' : `${b.errorRate.toFixed(2)}%`,
      };
    case 'peakErrorRate':
      return {
        sx: { ...cellSx, textAlign: 'right', fontWeight: 700,
          color: b.peakErrorRate == null ? 'text.disabled'
            : b.peakErrorRate >= 5 ? '#F87171' : b.peakErrorRate >= 1 ? '#FB923C' : 'text.secondary' },
        node: b.peakErrorRate == null ? '—' : `${b.peakErrorRate.toFixed(2)}%`,
      };
    case 'peakMaxResponseMs':
      return {
        sx: { ...cellSx, textAlign: 'right', fontWeight: 700,
          color: b.peakMaxResponseMs == null ? 'text.disabled' : b.peakMaxResponseMs >= 5000 ? '#F87171' : 'text.secondary' },
        node: b.peakMaxResponseMs == null ? '—' : fmtMs(b.peakMaxResponseMs),
      };
  }
}

export default function BreakdownTable({
  items, aiKeys, onAlarm, onSelect, selectedKey, variant = 'monitor',
}: {
  items: DomainBreakdownItem[];
  aiKeys: Set<string>;
  onAlarm: (b: DomainBreakdownItem) => void;
  onSelect?: (b: DomainBreakdownItem) => void;  // 행 클릭 → 호출 추이를 이 서비스로 (monitor)
  selectedKey?: string | null;                  // 강조할 서비스 key (monitor: 추이 선택 / design: 포커스)
  variant?: BreakdownVariant;
}) {
  const cols = variant === 'design' ? DESIGN_COLS
    : variant === 'errrate' || variant === 'errcount' ? ERROR_COLS
    : MONITOR_COLS;
  const defaultSort: SortKey = variant === 'design' ? 'peakErrorRate'
    : variant === 'errrate' ? 'errorRate'
    : variant === 'errcount' ? 'errCount'
    : 'throughput';
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const minWidth = cols.reduce((s, c) => s + c.minWidth, 0) + 44;

  // design: 포커스 행(selectedKey)으로 스크롤
  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (variant === 'design' && selectedKey && focusRef.current) {
      focusRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [variant, selectedKey]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const va = sortVal(a, sortKey);
      const vb = sortVal(b, sortKey);
      const na = typeof va === 'number';
      const nb = typeof vb === 'number';
      let cmp: number;
      if (na || nb) {
        // 숫자 컬럼 (peak은 null 가능 → 최하위로)
        cmp = (na ? (va as number) : -Infinity) - (nb ? (vb as number) : -Infinity);
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'opName' ? 'asc' : 'desc');
    }
  };

  return (
    <Box sx={{ overflow: 'auto', maxHeight: 440 }}>
      <Box component="table" sx={{
        width: '100%', minWidth, borderCollapse: 'collapse',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <Box component="thead">
          <Box component="tr">
            {cols.map((c) => (
              <Box
                component="th"
                key={c.key}
                sx={{
                  ...cellSx,
                  position: 'sticky', top: 0, zIndex: 1,
                  backgroundColor: 'rgba(23,27,38,0.98)',
                  textAlign: c.align, fontWeight: 700, color: 'text.disabled',
                  letterSpacing: '0.02em', minWidth: c.minWidth,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Tooltip title={c.tip ?? ''} placement="top" disableHoverListener={!c.tip}>
                  <TableSortLabel
                    active={sortKey === c.key}
                    direction={sortKey === c.key ? sortDir : 'desc'}
                    onClick={() => onSort(c.key)}
                    sx={{
                      color: c.tip ? '#A5B4FC !important' : 'inherit !important',
                      flexDirection: c.align === 'right' ? 'row-reverse' : 'row',
                      '& .MuiTableSortLabel-icon': { color: '#818CF8 !important', fontSize: 15 },
                      '&.Mui-active': { color: '#A5B4FC !important' },
                    }}
                  >
                    {c.label}
                  </TableSortLabel>
                </Tooltip>
              </Box>
            ))}
            {/* 알람 액션 열 */}
            <Box component="th" sx={{
              ...cellSx, position: 'sticky', top: 0, zIndex: 1,
              backgroundColor: 'rgba(23,27,38,0.98)', textAlign: 'center',
              minWidth: 44, borderBottom: '1px solid rgba(255,255,255,0.1)',
            }} />
          </Box>
        </Box>
        <Box component="tbody">
          {sorted.map((b) => {
            const key = `${b.name}|${b.opName}`;
            const hasAi = aiKeys.has(key);
            const selected = selectedKey === key;
            const clickable = variant !== 'design' && !!onSelect;
            const alarmTip = variant !== 'design'
              ? '알람 설계에서 이 서비스로 등록 →'
              : hasAi ? 'AI 제안값으로 알람 등록' : '이 서비스 지표로 알람 등록';
            return (
              <Box
                component="tr"
                key={key}
                ref={selected ? focusRef : undefined}
                onClick={clickable ? () => onSelect?.(b) : undefined}
                sx={{
                  cursor: clickable ? 'pointer' : 'default',
                  backgroundColor: selected ? 'rgba(99,102,241,0.14)' : 'transparent',
                  boxShadow: selected ? 'inset 3px 0 0 #6366F1' : 'none',
                  '&:hover': { backgroundColor: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)' },
                }}
              >
                {cols.map((c) => {
                  const { node, sx } = renderCell(b, c.key);
                  return <Box component="td" key={c.key} sx={sx}>{node}</Box>;
                })}
                {/* 알람 */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'center' }}>
                  <Tooltip title={alarmTip}>
                    <IconButton onClick={(e) => { e.stopPropagation(); onAlarm(b); }} size="small"
                      sx={{ p: 0.3, color: hasAi ? '#A5B4FC' : 'text.disabled',
                        '&:hover': { color: '#A5B4FC', backgroundColor: 'rgba(99,102,241,0.12)' } }}>
                      <AddAlertIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
