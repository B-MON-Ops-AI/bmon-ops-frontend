'use client';

/**
 * @file WidgetGrid.tsx
 * @description 대시보드 위젯 그리드 레이아웃 컴포넌트
 * @module features/dashboard/ui
 */

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import WidgetCard from './WidgetCard';
import { useWidgets, useDeleteWidget } from '@/features/dashboard/model/useDashboard';
import { useAppDispatch, showSnackbar } from '@/shared/store';

interface Props {
  onAddWidget?: () => void;
  serviceIds?: string[]; // null/undefined = 전체, 배열 = 해당 서비스만 표시
}

export default function WidgetGrid({ onAddWidget, serviceIds }: Props) {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useWidgets();
  const { mutate: deleteWidget } = useDeleteWidget();

  const handleDelete = (id: string) => {
    deleteWidget(id, {
      onSuccess: () => dispatch(showSnackbar({ message: '위젯이 삭제되었습니다.', severity: 'success' })),
      onError: () => dispatch(showSnackbar({ message: '위젯 삭제에 실패했습니다.', severity: 'error' })),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const allWidgets = data?.widgets ?? [];
  const widgets = serviceIds ? allWidgets.filter((w) => serviceIds.includes(w.serviceId)) : allWidgets;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={onAddWidget}>
          위젯 추가
        </Button>
      </Box>

      {widgets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">표시할 위젯이 없습니다.</Typography>
          <Button sx={{ mt: 2 }} startIcon={<AddIcon />} onClick={onAddWidget}>
            첫 번째 위젯 추가
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {widgets.map((widget) => (
            <Grid key={widget.id} item xs={12} sm={6} md={4} lg={3}>
              <WidgetCard widget={widget} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
