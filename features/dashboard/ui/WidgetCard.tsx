'use client';

/**
 * @file WidgetCard.tsx
 * @description 대시보드 메트릭 위젯 카드 컴포넌트
 * @module features/dashboard/ui
 */

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import MiniChart from '@/features/dashboard/ui/MiniChart';
import { useMetrics } from '@/features/dashboard/model/useDashboard';
import type { Widget } from '@/entities/dashboard';
import type { MetricType } from '@/entities/incident';

const metricLabels: Record<MetricType, string> = {
  error_rate: '에러율',
  response_time: '응답시간',
  traffic: '트래픽',
  request_count: '요청수',
};

const metricColors: Record<MetricType, string> = {
  error_rate: '#EF4444',
  response_time: '#F59E0B',
  traffic: '#3B82F6',
  request_count: '#10B981',
};

interface Props {
  widget: Widget;
  onDelete?: (id: string) => void;
}

export default function WidgetCard({ widget, onDelete }: Props) {
  const { data: metrics, isLoading } = useMetrics(widget.serviceId, widget.metricType);
  const color = metricColors[widget.metricType];

  const trendIcon =
    !metrics ? null :
    metrics.trend > 0 ? <TrendingUpIcon sx={{ color: '#EF4444', fontSize: 18 }} /> :
    metrics.trend < 0 ? <TrendingDownIcon sx={{ color: '#10B981', fontSize: 18 }} /> :
    <RemoveIcon sx={{ color: 'text.disabled', fontSize: 18 }} />;

  return (
    <Card
      sx={{
        height: 180,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'grab',
        '&:hover .delete-btn': { opacity: 1 },
      }}
    >
      {onDelete && (
        <Tooltip title="위젯 삭제">
          <IconButton
            className="delete-btn"
            size="small"
            onClick={() => onDelete(widget.id)}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              opacity: 0,
              transition: 'opacity 0.2s',
              zIndex: 1,
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <CardContent sx={{ flex: 1, pb: '8px !important' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          {widget.serviceName}
        </Typography>
        <Typography variant="body2" fontWeight={600} mb={1}>
          {metricLabels[widget.metricType]}
        </Typography>

        {isLoading ? (
          <Typography variant="caption" color="text.disabled">로딩 중...</Typography>
        ) : metrics ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography variant="h5" fontWeight={700} color={color}>
                {metrics.value.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">{metrics.unit}</Typography>
              {trendIcon}
            </Box>
            <MiniChart data={metrics.chartData} color={color} />
          </>
        ) : (
          <Typography variant="caption" color="text.disabled">데이터 없음</Typography>
        )}
      </CardContent>
    </Card>
  );
}
