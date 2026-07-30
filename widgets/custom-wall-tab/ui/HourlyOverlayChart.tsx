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

export default function HourlyOverlayChart({ data }: { data: DomainOverlayPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!data || data.length === 0) return null;

  const maxErr = Math.max(...data.map((d) => d.errCount), 1);

  return (
    <Box
      sx={{
        borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.02)', p: 1.75, pb: 1,
      }}
    >
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em', mb: 1 }}>
        호출 추이 (정상 · 응답 · 오류)
      </Typography>
      <Box sx={{ height: 260, overflow: 'hidden' }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} minTickGap={16} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={(v) => fmtMs(Number(v))} width={44} />
              {/* 오류호출 버블용 숨김 축 (자체 스케일로 세로 위치) */}
              <YAxis yAxisId="err" hide domain={[0, maxErr * 1.2]} />
              <ZAxis dataKey="errCount" range={[0, 340]} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: 4 }} iconSize={9} />
              <Line yAxisId="left" type="monotone" dataKey="normal" name="정상호출"
                stroke={C_NORMAL} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgResp" name="평균응답"
                stroke={C_RESP} strokeWidth={1.5} dot={false} />
              <Scatter yAxisId="err" dataKey="errCount" name="오류호출"
                fill={C_ERR} fillOpacity={0.5} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}
