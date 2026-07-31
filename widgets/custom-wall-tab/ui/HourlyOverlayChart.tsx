'use client';

/**
 * @file HourlyOverlayChart.tsx
 * @description 시간대별 호출 추이 — 정상호출(선)·평균응답(선, 우축)·오류호출(버블) 겹쳐보기.
 *   운영 '서비스 호출현황'(image6) 구조를 커스텀 Wall에 도입해 하루 리듬·오류 몰림을 한눈에.
 *   hover 시 그 시점의 전 지표(정상·오류·오류율·평균·최대 + 날짜/시각)를 한 툴팁에 모아 표시.
 * @module widgets/custom-wall-tab/ui
 */

import { useEffect, useState } from 'react';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import type { DomainOverlayPoint } from '@/entities/dashboard';

const C_NORMAL = '#34D399'; // 정상호출
const C_RESP = '#38BDF8';   // 평균응답
const C_ERR = '#F87171';    // 오류호출

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}
function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface TooltipEntry { payload?: DomainOverlayPoint }
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: TooltipEntry[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const when = d.ts ? dayjs(d.ts).format('YYYY/MM/DD HH:mm') : (label ?? '');
  const rows: [string, string, string][] = [
    ['정상호출', d.normal.toLocaleString(), C_NORMAL],
    ['오류호출', d.errCount.toLocaleString(), C_ERR],
    ['오류율', `${(d.errRate ?? 0).toFixed(2)}%`, d.errCount > 0 ? C_ERR : '#9CA3AF'],
    ['평균응답', fmtMs(d.avgResp), C_RESP],
    ['최대응답', fmtMs(d.maxResp ?? 0), '#A78BFA'],
  ];
  return (
    <Box sx={{
      px: 1.25, py: 0.9, borderRadius: 1.5, minWidth: 148,
      backgroundColor: 'rgba(15,18,28,0.97)', border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
    }}>
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mb: 0.5, fontWeight: 600 }}>
        {when}
      </Typography>
      {rows.map(([k, v, c]) => (
        <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, lineHeight: 1.6 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: c, mr: 0.6 }} />
            {k}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>
            {v}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// 이상 지점 판정 — 오류 발생 / 오류율↑ / 응답 급증
function isAnomaly(d: DomainOverlayPoint): boolean {
  return d.errCount > 0 || (d.errRate ?? 0) >= 1 || (d.maxResp ?? 0) >= 5000;
}

export default function HourlyOverlayChart({ data, scopeLabel, onClear, loading, onAnomalyClick }: {
  data: DomainOverlayPoint[];
  scopeLabel?: string;   // 선택된 서비스명 (없으면 도메인 전체)
  onClear?: () => void;  // '전체 보기'로 선택 해제
  loading?: boolean;
  onAnomalyClick?: () => void; // 이상 지점 마커 클릭 → 알람 설계 탭
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!data || data.length === 0) return null;

  const maxErr = Math.max(...data.map((d) => d.errCount), 1);
  // 이상 시각 = 상단 노란 삼각형 마커. 전용 축(anom, anomZ)으로 위치·크기를 고정해
  // 오류호출 버블과 스케일을 공유하지 않게 한다(예전 '삼각형 깨짐' 원인 제거). anom=0.9 → 상단 근처.
  const chartData = data.map((d) => ({ ...d, anom: isAnomaly(d) ? 0.9 : (null as number | null) }));
  const anomCount = chartData.filter((d) => d.anom != null).length;

  return (
    <Box
      sx={{
        borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.02)', p: 1.75, pb: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
          호출 추이 (정상 · 응답 · 오류)
        </Typography>
        {scopeLabel ? (
          <Chip
            label={scopeLabel}
            size="small"
            onDelete={onClear}
            sx={{
              height: 20, maxWidth: 320, fontSize: '0.62rem', fontFamily: 'monospace',
              backgroundColor: 'rgba(99,102,241,0.15)', color: '#A5B4FC',
              border: '1px solid rgba(99,102,241,0.35)',
              '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' },
              '& .MuiChip-deleteIcon': { color: '#A5B4FC', fontSize: 15, '&:hover': { color: '#fff' } },
            }}
          />
        ) : (
          <Chip label="도메인 전체" size="small"
            sx={{ height: 20, fontSize: '0.62rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.disabled', '& .MuiChip-label': { px: 0.75 } }} />
        )}
        {loading && <CircularProgress size={12} sx={{ color: '#818CF8' }} />}
        {anomCount > 0 && (
          <Chip
            label={`⚠ 이상 지점 ${anomCount}`}
            size="small"
            onClick={onAnomalyClick}
            sx={{
              height: 20, fontSize: '0.62rem', fontWeight: 700,
              backgroundColor: 'rgba(251,191,36,0.14)', color: '#FBBF24',
              border: '1px solid rgba(251,191,36,0.4)', cursor: onAnomalyClick ? 'pointer' : 'default',
              '& .MuiChip-label': { px: 0.75 },
              '&:hover': onAnomalyClick ? { backgroundColor: 'rgba(251,191,36,0.22)' } : {},
            }}
          />
        )}
        {scopeLabel && (
          <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
            행을 다시 클릭하거나 × 로 도메인 전체로 돌아갑니다
          </Typography>
        )}
      </Box>
      <Box sx={{ height: 260, overflow: 'hidden' }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} minTickGap={16} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={(v) => fmtMs(Number(v))} width={44} />
              {/* 오류호출 버블용 숨김 축 (자체 스케일로 세로 위치) */}
              <YAxis yAxisId="err" hide domain={[0, maxErr * 1.2]} />
              {/* 이상 삼각형용 숨김 축 (상단 고정) */}
              <YAxis yAxisId="anom" hide domain={[0, 1]} />
              <ZAxis dataKey="errCount" range={[0, 340]} />
              {/* 이상 삼각형 전용 크기축 — 고정(오류호출 버블과 스케일 분리) */}
              <ZAxis zAxisId="anomZ" range={[150, 150]} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: 4 }} iconSize={9} />
              <Line yAxisId="left" type="monotone" dataKey="normal" name="정상호출"
                stroke={C_NORMAL} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgResp" name="평균응답"
                stroke={C_RESP} strokeWidth={1.5} dot={false} />
              <Scatter yAxisId="err" dataKey="errCount" name="오류호출"
                fill={C_ERR} fillOpacity={0.5} />
              <Scatter yAxisId="anom" zAxisId="anomZ" dataKey="anom" name="이상 지점"
                fill="#FBBF24" shape="triangle" stroke="rgba(15,18,28,0.9)" strokeWidth={1}
                onClick={onAnomalyClick}
                style={{ cursor: onAnomalyClick ? 'pointer' : 'default' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}
