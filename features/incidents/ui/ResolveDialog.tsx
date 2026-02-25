'use client';

/**
 * @file ResolveDialog.tsx
 * @description 인시던트 해결 완료 다이얼로그
 * @module features/incidents/ui
 */

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (resolution: string) => void;
  isPending?: boolean;
}

export default function ResolveDialog({ open, onClose, onConfirm, isPending }: Props) {
  const [resolution, setResolution] = useState('');

  const handleConfirm = () => {
    if (!resolution.trim()) return;
    onConfirm(resolution.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>인시던트 해결</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="해결 내용"
          placeholder="어떻게 해결했는지 입력하세요..."
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={!resolution.trim() || isPending}
        >
          해결 완료
        </Button>
      </DialogActions>
    </Dialog>
  );
}
