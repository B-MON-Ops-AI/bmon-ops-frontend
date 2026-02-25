'use client';

/**
 * @file MiniChart.tsx
 * @description 위젯 내 미니 영역 차트 컴포넌트
 * @module features/dashboard/ui
 */

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import type { ChartDataPoint } from '@/entities/dashboard';

interface Props {
  data: ChartDataPoint[];
  color?: string;
}

export default function MiniChart({ data, color = '#3B82F6' }: Props) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          animationDuration={300}
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
