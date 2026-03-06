'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (resolution: string) => void;
  isPending?: boolean;
}

export default function ResolveDialog({ open, onClose, onConfirm, isPending }: Props) {
  // 상태 초기화를 useEffect가 아닌 컴포넌트 레벨에서 관리하거나, 아예 하지 않음
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    if (!value.trim()) return;
    onConfirm(value.trim());
    setValue(''); // 성공 후 초기화
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      // 포커스 강제 로직 비활성화하여 부모와의 충돌 방지
      disableEnforceFocus 
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>인시던트 해결 보고</DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          어떻게 해결하셨나요? 조치 내용을 상세히 기록해 주세요.
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={15}
          placeholder="여기에 해결 내용을 입력하세요..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          variant="outlined"
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} color="inherit">취소</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={!value.trim() || isPending}
        >
          {isPending ? '처리 중...' : '해결 완료 등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
