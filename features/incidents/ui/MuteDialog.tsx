'use client';

/**
 * @file MuteDialog.tsx
 * @description 인시던트 알림 음소거 다이얼로그
 * @module features/incidents/ui
 */

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

const MUTE_OPTIONS = [
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
  { label: '2시간', value: 120 },
  { label: '4시간', value: 240 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  isPending?: boolean;
}

export default function MuteDialog({ open, onClose, onConfirm, isPending }: Props) {
  const [minutes, setMinutes] = useState(60);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>알림 음소거</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          음소거 시간을 선택하세요.
        </Typography>
        <ToggleButtonGroup
          value={minutes}
          exclusive
          onChange={(_, v) => v && setMinutes(v)}
          fullWidth
          size="small"
        >
          {MUTE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={() => onConfirm(minutes)} disabled={isPending}>
          음소거
        </Button>
      </DialogActions>
    </Dialog>
  );
}
