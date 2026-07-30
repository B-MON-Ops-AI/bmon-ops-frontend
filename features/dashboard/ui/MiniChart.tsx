'use client';

/**
 * @file MiniChart.tsx
 * @description 위젯 내 미니 영역 차트 컴포넌트
 * @module features/dashboard/ui
 */

import { useEffect, useId, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';
import dayjs from 'dayjs';
import type { ChartDataPoint } from '@/entities/dashboard';

interface Props {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  /** hover 툴팁 상단 라벨 (지표명, 예: "처리량") */
  tooltipLabel?: string;
  /** 값 포맷터 (단위 포함, 예: v => `${v.toLocaleString()}건`) */
  valueFormatter?: (v: number) => string;
}

interface TooltipPayloadItem {
  value?: number;
  payload?: ChartDataPoint;
}

/** 값(숫자+단위) + 날짜/시각(ts)을 함께 보여주는 커스텀 툴팁 */
function ChartTooltip({
  active, payload, label, tooltipLabel, valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  tooltipLabel?: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const v = p.value ?? 0;
  const ts = p.payload?.ts;
  // ts(ISO)가 있으면 날짜+시각까지, 없으면 데이터포인트의 시각 라벨(HH:MM) → 최후 축 라벨
  const when = ts
    ? dayjs(ts).format('YYYY/MM/DD HH:mm')
    : (p.payload?.time ?? label ?? '');
  return (
    <div
      style={{
        backgroundColor: 'rgba(17,24,39,0.97)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 8,
        padding: '5px 9px',
        fontSize: 12,
        lineHeight: 1.45,
        color: '#E5E7EB',
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 700 }}>
        {tooltipLabel ? `${tooltipLabel} ` : ''}{valueFormatter(v)}
      </div>
      {when && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{when}</div>}
    </div>
  );
}

export default function MiniChart({
  data, color = '#3B82F6', height = 60, tooltipLabel, valueFormatter,
}: Props) {
  // SSR에서 ResponsiveContainer는 width=0으로 측정 → 마운트 후에만 렌더링
  const [mounted, setMounted] = useState(false);
  // gradId는 인스턴스당 안정적 고유값 (SVG id/url 참조용 — colon 제거)
  const gradId = `grad-${useId().replace(/:/g, '')}`;
  const yMax = (dataMax: number) => Math.max(dataMax, 1);
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());

  useEffect(() => {
    // SSR/정적 프리렌더 후 클라이언트 마운트에서만 차트 렌더 (ResponsiveContainer 0-width 회피)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ height }} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[0, yMax]} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
          offset={12}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 50 }}
          content={
            <ChartTooltip tooltipLabel={tooltipLabel} valueFormatter={fmt} />
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
