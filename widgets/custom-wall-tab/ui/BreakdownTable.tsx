'use client';

/**
 * @file BreakdownTable.tsx
 * @description 처리량 상위 서비스 — 레거시 '호출 현황 목록' 스타일 정렬 데이터 테이블.
 *   정상(I/D)·오류(S/E)·오류율(S/E)·평균·최대·σ를 열 정렬로 노출, 헤더 클릭 정렬, 행별 알람 등록.
 * @module widgets/custom-wall-tab/ui
 */

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TableSortLabel from '@mui/material/TableSortLabel';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import type { DomainBreakdownItem } from '@/entities/dashboard';

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

type SortKey =
  | 'name' | 'opName' | 'throughput' | 'dealD' | 'errS' | 'errE'
  | 'errorRateS' | 'errorRateE' | 'avgResponseMs' | 'maxResponseMs' | 'responseStdDev';
type SortDir = 'asc' | 'desc';

interface Col {
  key: SortKey;
  label: string;
  align: 'left' | 'right';
  numeric: boolean;
  minWidth: number;
}

const COLS: Col[] = [
  { key: 'name',          label: '서비스명',   align: 'left',  numeric: false, minWidth: 190 },
  { key: 'opName',        label: 'OP',        align: 'left',  numeric: false, minWidth: 130 },
  { key: 'throughput',    label: '정상(I)',   align: 'right', numeric: true,  minWidth: 78 },
  { key: 'dealD',         label: '정상(D)',   align: 'right', numeric: true,  minWidth: 70 },
  { key: 'errS',          label: '오류(S)',   align: 'right', numeric: true,  minWidth: 70 },
  { key: 'errE',          label: '오류(E)',   align: 'right', numeric: true,  minWidth: 70 },
  { key: 'errorRateS',    label: '오류율(S)', align: 'right', numeric: true,  minWidth: 76 },
  { key: 'errorRateE',    label: '오류율(E)', align: 'right', numeric: true,  minWidth: 76 },
  { key: 'avgResponseMs', label: '평균',      align: 'right', numeric: true,  minWidth: 66 },
  { key: 'maxResponseMs', label: '최대',      align: 'right', numeric: true,  minWidth: 66 },
  { key: 'responseStdDev',label: 'σ',         align: 'right', numeric: true,  minWidth: 60 },
];

const cellSx = {
  px: 1, py: 0.9, fontSize: '0.7rem', whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
} as const;

export default function BreakdownTable({ items, aiKeys, onAlarm }: {
  items: DomainBreakdownItem[];
  aiKeys: Set<string>;
  onAlarm: (b: DomainBreakdownItem) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('throughput');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
      else cmp = String(va ?? '').localeCompare(String(vb ?? ''));
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
        width: '100%', minWidth: 900, borderCollapse: 'collapse',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <Box component="thead">
          <Box component="tr">
            {COLS.map((c) => (
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
                <TableSortLabel
                  active={sortKey === c.key}
                  direction={sortKey === c.key ? sortDir : 'desc'}
                  onClick={() => onSort(c.key)}
                  sx={{
                    color: 'inherit !important',
                    flexDirection: c.align === 'right' ? 'row-reverse' : 'row',
                    '& .MuiTableSortLabel-icon': { color: '#818CF8 !important', fontSize: 15 },
                    '&.Mui-active': { color: '#A5B4FC !important' },
                  }}
                >
                  {c.label}
                </TableSortLabel>
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
            return (
              <Box component="tr" key={key} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                {/* 서비스명 */}
                <Box component="td" sx={{ ...cellSx, maxWidth: 220 }}>
                  <Tooltip title={b.name} placement="top-start">
                    <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'text.primary',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}>
                      {b.name}
                    </Typography>
                  </Tooltip>
                </Box>
                {/* OP */}
                <Box component="td" sx={{ ...cellSx, maxWidth: 150 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'text.disabled',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                    {b.opName || '—'}
                  </Typography>
                </Box>
                {/* 정상(I) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                  {b.throughput.toLocaleString()}
                </Box>
                {/* 정상(D) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: 'text.disabled' }}>
                  {b.dealD.toLocaleString()}
                </Box>
                {/* 오류(S) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: b.errS > 0 ? '#F87171' : 'text.disabled' }}>
                  {b.errS.toLocaleString()}
                </Box>
                {/* 오류(E) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: b.errE > 0 ? '#FB923C' : 'text.disabled' }}>
                  {b.errE.toLocaleString()}
                </Box>
                {/* 오류율(S) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: b.errorRateS > 0 ? '#F87171' : 'text.disabled' }}>
                  {b.errorRateS.toFixed(2)}%
                </Box>
                {/* 오류율(E) */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: b.errorRateE > 0 ? '#FB923C' : 'text.disabled' }}>
                  {b.errorRateE.toFixed(2)}%
                </Box>
                {/* 평균 */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: 'text.secondary' }}>
                  {fmtMs(b.avgResponseMs)}
                </Box>
                {/* 최대 */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: b.maxResponseMs >= 5000 ? '#FB923C' : 'text.secondary' }}>
                  {fmtMs(b.maxResponseMs)}
                </Box>
                {/* σ */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'right', color: 'text.disabled' }}>
                  {fmtMs(b.responseStdDev)}
                </Box>
                {/* 알람 */}
                <Box component="td" sx={{ ...cellSx, textAlign: 'center' }}>
                  <Tooltip title={hasAi ? 'AI 제안값으로 알람 등록' : '이 서비스 지표로 알람 등록'}>
                    <IconButton onClick={() => onAlarm(b)} size="small"
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
