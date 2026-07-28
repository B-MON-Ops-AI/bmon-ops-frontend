'use client';

/**
 * @file MiniChart.tsx
 * @description 위젯 내 미니 영역 차트 컴포넌트
 * @module features/dashboard/ui
 */

import { useEffect, useId, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';
import type { ChartDataPoint } from '@/entities/dashboard';

interface Props {
  data: ChartDataPoint[];
  color?: string;
}

export default function MiniChart({ data, color = '#3B82F6' }: Props) {
  // SSR에서 ResponsiveContainer는 width=0으로 측정 → 마운트 후에만 렌더링
  const [mounted, setMounted] = useState(false);
  // gradId는 인스턴스당 안정적 고유값 (SVG id/url 참조용 — colon 제거)
  const gradId = `grad-${useId().replace(/:/g, '')}`;
  const yMax = (dataMax: number) => Math.max(dataMax, 1);

  useEffect(() => {
    // SSR/정적 프리렌더 후 클라이언트 마운트에서만 차트 렌더 (ResponsiveContainer 0-width 회피)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ height: 60 }} />;

  return (
    <ResponsiveContainer width="100%" height={60}>
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
          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ display: 'none' }}
          formatter={(v: number | undefined) => [v ?? 0, ''] as [number, string]}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
