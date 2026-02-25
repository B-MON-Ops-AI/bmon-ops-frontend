'use client';

/**
 * @file CustomWallTab.tsx
 * @description 커스텀 월 탭 위젯 (위젯 그리드, 위젯 추가 다이얼로그)
 * @module widgets/custom-wall-tab/ui
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { WidgetGrid, useAddWidget } from '@/features/dashboard';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { MetricType } from '@/entities/incident';

const METRIC_TYPES: { value: MetricType; label: string }[] = [
  { value: 'error_rate', label: '에러율 (%)' },
  { value: 'response_time', label: '응답시간 (ms)' },
  { value: 'traffic', label: '트래픽 (req/s)' },
  { value: 'request_count', label: '요청수 (req)' },
];

export default function CustomWallTab() {
  const dispatch = useAppDispatch();
  const [addOpen, setAddOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [metricType, setMetricType] = useState<MetricType>('error_rate');

  const { mutate: addWidget, isPending } = useAddWidget();

  const handleAdd = () => {
    if (!serviceId.trim()) return;
    addWidget(
      { serviceId: serviceId.trim(), metricType },
      {
        onSuccess: () => {
          setAddOpen(false);
          setServiceId('');
          setMetricType('error_rate');
          dispatch(showSnackbar({ message: '위젯이 추가되었습니다.', severity: 'success' }));
        },
        onError: () =>
          dispatch(showSnackbar({ message: '위젯 추가에 실패했습니다.', severity: 'error' })),
      }
    );
  };

  return (
    <>
      <WidgetGrid onAddWidget={() => setAddOpen(true)} />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>위젯 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="서비스 ID"
              size="small"
              fullWidth
              placeholder="예: payment-service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              autoFocus
            />
            <TextField
              label="메트릭 유형"
              size="small"
              fullWidth
              select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
            >
              {METRIC_TYPES.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={isPending || !serviceId.trim()}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
