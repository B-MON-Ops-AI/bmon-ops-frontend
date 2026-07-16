'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import dayjs from 'dayjs';
import { advisorApi } from '@/features/advisor';
import type { ThresholdSuggestion } from '@/features/advisor';

const LEVEL_COLOR: Record<string, string> = {
  Critical: '#EF4444',
  Major:    '#F59E0B',
  Minor:    '#64748B',
  Fatal:    '#DC2626',
};

function SuggestionCard({ suggestion, onApprove, onReject, isActing }: {
  suggestion: ThresholdSuggestion;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isActing: boolean;
}) {
  const isPending = suggestion.status === 'pending';
  const levelColor = LEVEL_COLOR[suggestion.alarm_level] ?? '#64748B';
  const increaseRatio = ((suggestion.suggested_threshold - suggestion.current_threshold) / suggestion.current_threshold * 100).toFixed(0);

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        border: isPending ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        p: 2,
        backgroundColor: isPending ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.02)',
        opacity: isPending ? 1 : 0.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.68rem', color: 'primary.light', fontWeight: 600, mb: 0.25 }}>
            {suggestion.service_name}
          </Typography>
          <Typography sx={{
            fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {suggestion.alarm_name}
          </Typography>
        </Box>
        <Chip
          label={suggestion.alarm_level}
          size="small"
          sx={{
            height: 18, fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
            backgroundColor: `${levelColor}22`, color: levelColor,
            border: `1px solid ${levelColor}44`,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      {/* 임계값 변경 시각화 */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1.5, p: 1,
      }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>현재</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1.2 }}>
            {suggestion.current_threshold.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
          <TrendingUpIcon sx={{ fontSize: 14, color: '#818CF8' }} />
          <Chip
            label={`+${increaseRatio}%`}
            size="small"
            sx={{
              height: 14, fontSize: '0.58rem', fontWeight: 700,
              backgroundColor: 'rgba(129,140,248,0.2)', color: '#818CF8',
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>제안</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#818CF8', lineHeight: 1.2 }}>
            {suggestion.suggested_threshold.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* 근거 */}
      <Box sx={{
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderLeft: '2px solid #818CF8',
        borderRadius: '0 4px 4px 0',
        px: 1, py: 0.75, flex: 1,
      }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.55 }}>
          {suggestion.rationale}
        </Typography>
      </Box>

      {/* 버튼 / 상태 */}
      {isPending ? (
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Button
            size="small" variant="outlined" fullWidth
            disabled={isActing}
            onClick={() => onReject(suggestion.alarm_id)}
            startIcon={<CancelOutlinedIcon sx={{ fontSize: '13px !important' }} />}
            sx={{
              fontSize: '0.68rem', py: 0.4,
              borderColor: 'rgba(255,255,255,0.12)', color: 'text.secondary',
              '&:hover': { borderColor: '#EF4444', color: '#EF4444' },
            }}
          >
            거절
          </Button>
          <Button
            size="small" variant="contained" fullWidth
            disabled={isActing}
            onClick={() => onApprove(suggestion.alarm_id)}
            startIcon={isActing
              ? <CircularProgress size={11} color="inherit" />
              : <CheckCircleOutlineIcon sx={{ fontSize: '13px !important' }} />
            }
            sx={{
              fontSize: '0.68rem', py: 0.4,
              backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4F46E5' },
            }}
          >
            승인
          </Button>
        </Box>
      ) : (
        <Chip
          label={suggestion.status === 'approved' ? '✓ 승인됨' : '✗ 거절됨'}
          size="small"
          sx={{
            fontSize: '0.65rem', height: 20, alignSelf: 'flex-start',
            backgroundColor: suggestion.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
            color: suggestion.status === 'approved' ? '#10B981' : '#64748B',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}
    </Box>
  );
}

export default function AdvisorSection() {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['advisor-suggestions'],
    queryFn: advisorApi.getSuggestions,
    refetchInterval: 60_000,
  });

  const analyzeMutation = useMutation({
    mutationFn: advisorApi.analyze,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advisor-suggestions'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (alarmId: string) => advisorApi.approve(alarmId),
    onSettled: () => { setActingId(null); queryClient.invalidateQueries({ queryKey: ['advisor-suggestions'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (alarmId: string) => advisorApi.reject(alarmId),
    onSettled: () => { setActingId(null); queryClient.invalidateQueries({ queryKey: ['advisor-suggestions'] }); },
  });

  const handleApprove = (alarmId: string) => { setActingId(alarmId); approveMutation.mutate(alarmId); };
  const handleReject  = (alarmId: string) => { setActingId(alarmId); rejectMutation.mutate(alarmId); };

  const suggestions  = data?.suggestions ?? [];
  const pendingCount = data?.pendingCount ?? 0;
  const lastAt       = data?.lastAnalyzedAt;

  return (
    <Box>
      {/* 섹션 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighIcon sx={{ fontSize: 16, color: '#818CF8' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
            AI 임계값 조정 제안
          </Typography>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount}건 검토 필요`}
              size="small"
              sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 700,
                backgroundColor: 'rgba(99,102,241,0.15)', color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.3)',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
          {lastAt && (
            <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
              · 마지막 분석 {dayjs(lastAt).format('MM-DD HH:mm')}
            </Typography>
          )}
        </Box>
        <Tooltip title="새로 분석">
          <IconButton size="small" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending
              ? <CircularProgress size={14} />
              : <RefreshIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* 카드 슬라이드 */}
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.disabled">분석 결과 불러오는 중...</Typography>
        </Box>
      ) : suggestions.length === 0 ? (
        <Box sx={{
          py: 2.5, px: 3,
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 2,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <AutoFixHighIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
          <Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              노이즈 알람이 탐지되지 않았습니다.
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
              새로 분석 버튼으로 최신 데이터를 조회하세요.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.alarm_id}
                suggestion={s}
                onApprove={handleApprove}
                onReject={handleReject}
                isActing={actingId === s.alarm_id}
              />
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', mt: 1 }}>
            승인 시 운영 DB(mo_alarm_cond)의 임계값이 즉시 변경됩니다.
          </Typography>
        </>
      )}
    </Box>
  );
}
