'use client';

/**
 * @file ThresholdTab.tsx
 * @description 서비스별 임계값 설정 테이블 컴포넌트
 * @module features/settings/ui
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useThresholds, useUpdateThreshold } from '@/features/settings/model/useSettings';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { Threshold } from '@/entities/settings';

interface EditState {
  serviceId: string;
  errorRate: string;
  responseTime: string;
  traffic: string;
}

export default function ThresholdTab() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useThresholds();
  const { mutate: updateThreshold, isPending } = useUpdateThreshold();
  const [editing, setEditing] = useState<EditState | null>(null);

  const startEdit = (t: Threshold) => {
    setEditing({
      serviceId: t.serviceId,
      errorRate: String(t.errorRate),
      responseTime: String(t.responseTime),
      traffic: String(t.traffic),
    });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing) return;
    updateThreshold(
      {
        serviceId: editing.serviceId,
        data: {
          errorRate: Number(editing.errorRate),
          responseTime: Number(editing.responseTime),
          traffic: Number(editing.traffic),
        },
      },
      {
        onSuccess: () => {
          setEditing(null);
          dispatch(showSnackbar({ message: '임계값이 저장되었습니다.', severity: 'success' }));
        },
        onError: () => dispatch(showSnackbar({ message: '저장에 실패했습니다.', severity: 'error' })),
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>서비스</TableCell>
            <TableCell>에러율 (%)</TableCell>
            <TableCell>응답시간 (ms)</TableCell>
            <TableCell>트래픽 (req/s)</TableCell>
            <TableCell align="right">편집</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.thresholds ?? []).map((t) => {
            const isEdit = editing?.serviceId === t.serviceId;
            return (
              <TableRow key={t.serviceId}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{t.serviceName}</Typography>
                </TableCell>
                <TableCell>
                  {isEdit ? (
                    <TextField
                      value={editing!.errorRate}
                      onChange={(e) => setEditing((prev) => prev ? { ...prev, errorRate: e.target.value } : null)}
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                    />
                  ) : (
                    <Typography variant="body2">{t.errorRate}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEdit ? (
                    <TextField
                      value={editing!.responseTime}
                      onChange={(e) => setEditing((prev) => prev ? { ...prev, responseTime: e.target.value } : null)}
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                    />
                  ) : (
                    <Typography variant="body2">{t.responseTime}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEdit ? (
                    <TextField
                      value={editing!.traffic}
                      onChange={(e) => setEditing((prev) => prev ? { ...prev, traffic: e.target.value } : null)}
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                    />
                  ) : (
                    <Typography variant="body2">{t.traffic}</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {isEdit ? (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="저장">
                        <IconButton size="small" onClick={saveEdit} disabled={isPending} color="success">
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="취소">
                        <IconButton size="small" onClick={cancelEdit}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="편집">
                      <IconButton size="small" onClick={() => startEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
