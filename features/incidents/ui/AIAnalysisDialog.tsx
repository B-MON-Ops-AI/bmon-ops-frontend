'use client';

/**
 * @file AIAnalysisDialog.tsx
 * @description AI 분석 결과 다이얼로그 (원인, 권장 조치, 유사 사례)
 * @module features/incidents/ui
 */

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useAIAnalysis, useRequestAnalysis } from '@/features/incidents/model/useAI';
import { useAppDispatch, showSnackbar } from '@/shared/store';

interface Props {
  incidentId: string | null;
  onClose: () => void;
}

export default function AIAnalysisDialog({ incidentId, onClose }: Props) {
  const dispatch = useAppDispatch();
  const open = !!incidentId;
  const { data: analysis, isLoading } = useAIAnalysis(incidentId);
  const { mutate: requestAnalysis, isPending: isRequesting } = useRequestAnalysis();

  const handleRequest = () => {
    if (!incidentId) return;
    requestAnalysis(incidentId, {
      onError: () => dispatch(showSnackbar({ message: 'AI 분석 요청에 실패했습니다.', severity: 'error' })),
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!analysis) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" mb={2}>AI 분석이 아직 시작되지 않았습니다.</Typography>
          <Button variant="contained" onClick={handleRequest} disabled={isRequesting}>
            AI 분석 시작
          </Button>
        </Box>
      );
    }

    if (analysis.status === 'pending' || analysis.status === 'in_progress') {
      return (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {analysis.currentStep ?? '분석 중...'}
          </Typography>
          <LinearProgress variant="determinate" value={analysis.progress} sx={{ borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block" textAlign="right">
            {analysis.progress}%
          </Typography>
        </Box>
      );
    }

    if (analysis.status === 'failed') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="error" mb={2}>분석 실패. 다시 시도하세요.</Typography>
          <Button variant="outlined" onClick={handleRequest} disabled={isRequesting}>재시도</Button>
        </Box>
      );
    }

    const result = analysis.result;
    if (!result) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="primary" mb={1}>무엇이 변화했나</Typography>
          <List dense disablePadding>
            {result.whatChanged.map((item, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText primary={`• ${item}`} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="primary" mb={1}>원인 분석</Typography>
          {result.whyHappened.map((cause, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
              <Chip
                label={`${Math.round(cause.confidence * 100)}%`}
                size="small"
                sx={{ minWidth: 52, backgroundColor: '#3B82F622', color: '#3B82F6', fontSize: '0.7rem' }}
              />
              <Typography variant="body2">{cause.cause}</Typography>
            </Box>
          ))}
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="primary" mb={1}>권장 조치</Typography>
          <List dense disablePadding>
            {result.recommendedActions.map((action, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText
                  primary={`${i + 1}. ${action}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {result.similarCases.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="primary" mb={1}>유사 사례</Typography>
              {result.similarCases.map((sc, i) => (
                <Box key={i} sx={{ mb: 1, p: 1.5, borderRadius: 1, backgroundColor: '#1F2937' }}>
                  <Typography variant="caption" color="text.secondary">{sc.date} · {sc.serviceName}</Typography>
                  <Typography variant="body2" mb={0.5}>{sc.alarmName} ({sc.thresholdValue.toLocaleString()}건)</Typography>
                  {sc.resolution && <Typography variant="caption" color="success.main">해결: {sc.resolution}</Typography>}
                  {sc.clearYn && !sc.resolution && <Typography variant="caption" color="success.main">자동 해소</Typography>}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>AI 분석 결과</DialogTitle>
      <DialogContent dividers>{renderContent()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
