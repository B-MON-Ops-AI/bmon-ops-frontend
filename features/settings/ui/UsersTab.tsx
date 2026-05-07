'use client';

/**
 * @file UsersTab.tsx
 * @description 사용자 관리 테이블 컴포넌트 (CRUD)
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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import dayjs from 'dayjs';
import { useUsers, useCreateUser, useDeactivateUser } from '@/features/settings/model/useSettings';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { CreateUserRequest } from '@/entities/settings';
import type { UserRole } from '@/entities/auth';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

const defaultForm: CreateUserRequest = { id: '', name: '', email: '', password: '', role: 'VIEWER' };

export default function UsersTab() {
  const dispatch = useAppDispatch();
  const [page] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateUserRequest>(defaultForm);

  const { data, isLoading } = useUsers(page, 10);
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: deactivateUser, isPending: deactivating } = useDeactivateUser();

  const setFormField = <K extends keyof CreateUserRequest>(key: K, value: CreateUserRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    createUser(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm(defaultForm);
        dispatch(showSnackbar({ message: '사용자가 생성되었습니다.', severity: 'success' }));
      },
      onError: () => dispatch(showSnackbar({ message: '사용자 생성에 실패했습니다.', severity: 'error' })),
    });
  };

  const handleDeactivate = (userId: string) => {
    deactivateUser(userId, {
      onSuccess: () => dispatch(showSnackbar({ message: '사용자가 비활성화되었습니다.', severity: 'success' })),
      onError: () => dispatch(showSnackbar({ message: '처리에 실패했습니다.', severity: 'error' })),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<PersonAddIcon />} variant="contained" size="small" onClick={() => setCreateOpen(true)}>
          사용자 추가
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell><Typography variant="body2" fontWeight={500}>{u.name}</Typography></TableCell>
                <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    color={u.role === 'ADMIN' ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.isActive ? '활성' : '비활성'}
                    size="small"
                    color={u.isActive ? 'success' : 'default'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{dayjs(u.createdAt).format('YYYY-MM-DD')}</Typography>
                </TableCell>
                <TableCell align="right">
                  {u.isActive && (
                    <Tooltip title="비활성화">
                      <IconButton size="small" onClick={() => handleDeactivate(u.id)} disabled={deactivating}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 사용자 생성 다이얼로그 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>사용자 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="ID"
              size="small"
              fullWidth
              value={form.id}
              onChange={(e) => setFormField('id', e.target.value)}
            />
            <TextField
              label="이름"
              size="small"
              fullWidth
              value={form.name}
              onChange={(e) => setFormField('name', e.target.value)}
            />
            <TextField
              label="이메일"
              size="small"
              fullWidth
              type="email"
              value={form.email}
              onChange={(e) => setFormField('email', e.target.value)}
            />
            <TextField
              label="비밀번호"
              size="small"
              fullWidth
              type="password"
              value={form.password}
              onChange={(e) => setFormField('password', e.target.value)}
            />
            <TextField
              label="역할"
              size="small"
              fullWidth
              select
              value={form.role}
              onChange={(e) => setFormField('role', e.target.value as UserRole)}
            >
              {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !form.id || !form.name || !form.email || !form.password}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
