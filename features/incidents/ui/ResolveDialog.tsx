'use client';

/**
 * @file ResolveDialog.tsx
 * @description 인시던트 해결 완료 다이얼로그 (AI 권장 조치 패널 포함)
 * @module features/incidents/ui
 */

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (resolution: string, disposerId: string) => void;
  isPending?: boolean;
  recommendedActions?: string[];
  isAnalysisLoading?: boolean;
}

export default function ResolveDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  recommendedActions,
  isAnalysisLoading,
}: Props) {
  const [resolution, setResolution] = useState('');
  const [disposerId, setDisposerId] = useState('');

  const handleConfirm = () => {
    if (!resolution.trim() || !disposerId.trim()) return;
    onConfirm(resolution.trim(), disposerId.trim());
  };

  const handleApplyAI = () => {
    if (!recommendedActions?.length) return;
    const text = recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n');
    setResolution(text);
  };

  const hasActions = (recommendedActions?.length ?? 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1, fontSize: '1.15rem', fontWeight: 700 }}>
        인시던트 해결
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>

        {/* ── AI 권장 조치 패널 ── */}
        <Box
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(99,102,241,0.3)',
            backgroundColor: 'rgba(99,102,241,0.06)',
            overflow: 'hidden',
            mb: 2.5,
          }}
        >
          {/* 패널 헤더 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.25,
              borderBottom: '1px solid rgba(99,102,241,0.2)',
              backgroundColor: 'rgba(99,102,241,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon sx={{ fontSize: 16, color: '#818CF8' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: '#818CF8', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                AI 권장 조치
              </Typography>
            </Box>
            {hasActions && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleApplyAI}
                sx={{
                  fontSize: '0.65rem',
                  py: 0.25,
                  px: 1,
                  minWidth: 0,
                  height: 24,
                  borderColor: 'rgba(99,102,241,0.5)',
                  color: '#818CF8',
                  '&:hover': { borderColor: '#818CF8', backgroundColor: 'rgba(99,102,241,0.12)' },
                }}
              >
                해결 내용에 적용
              </Button>
            )}
          </Box>

          {/* 패널 본문 */}
          <Box sx={{ px: 2, py: 1.75, minHeight: 64 }}>
            {isAnalysisLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={14} sx={{ color: '#818CF8' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                  AI 분석 중...
                </Typography>
              </Box>
            ) : hasActions ? (
              <Box>
                {recommendedActions!.map((action, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: i < recommendedActions!.length - 1 ? 1 : 0 }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(99,102,241,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: '1px',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.6rem', color: '#818CF8', fontWeight: 700, lineHeight: 1 }}>
                        {i + 1}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                      {action}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                AI 분석이 완료되면 권장 조치가 표시됩니다.
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 2.5 }} />

        {/* ── 처리자 사번 입력 ── */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 1, fontSize: '0.75rem' }}>
            처리자 사번
          </Typography>
          <Box
            component="input"
            placeholder="예: 82000001"
            value={disposerId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisposerId(e.target.value)}
            sx={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid rgba(255,255,255,0.23)',
              borderRadius: 1,
              p: '10px 14px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.87)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              outline: 'none',
              '&:focus': { borderColor: '#6366F1', borderWidth: '2px' },
              '&::placeholder': { color: 'rgba(255,255,255,0.3)' },
            }}
          />
        </Box>

        {/* ── 해결 내용 입력 ── */}
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 1, fontSize: '0.75rem' }}>
            해결 내용
          </Typography>
          <Box
            component="textarea"
            rows={8}
            placeholder="어떻게 해결했는지 입력하세요..."
            value={resolution}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolution(e.target.value)}
            sx={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid rgba(255,255,255,0.23)',
              borderRadius: 1,
              p: '12px 14px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.87)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              '&:focus': { borderColor: '#6366F1', borderWidth: '2px' },
              '&::placeholder': { color: 'rgba(255,255,255,0.3)' },
            }}
          />
        </Box>

      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 1, px: 3, pb: 3, pt: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ minWidth: 80 }}>취소</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={!resolution.trim() || !disposerId.trim() || isPending}
          sx={{ minWidth: 100 }}
        >
          해결 완료
        </Button>
      </DialogActions>
    </Dialog>
  );
}
