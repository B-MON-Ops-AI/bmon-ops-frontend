'use client';

/**
 * @file IncidentWallCard.tsx
 * @description 인시던트 월 카드 컴포넌트 (심각도, 상태, 메트릭 표시)
 * @module features/incidents/ui
 */

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { SeverityChip } from '@/shared/ui';
import { StatusChip } from '@/shared/ui';
import type { Incident } from '@/entities/incident';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const detectTypeLabels: Record<string, string> = {
  ERR_S: '시스템오류',
  RPY_TIME: '응답시간',
  ERR_RATE: '오류율',
  ERR_E: '외부오류',
  CALL_CASCNT: '호출건수',
};

const detectTermLabels: Record<string, string> = {
  MIN1: '1분',
  MIN5: '5분',
  MIN10: '10분',
  HOUR1: '1시간',
  DAY1: '1일',
};

/** 30분 이내 발생한 인시던트를 신규로 표시 */
const NEW_THRESHOLD_MINUTES = 30;

interface Props {
  incident: Incident;
  onClick: (incident: Incident) => void;
}

export default function IncidentWallCard({ incident, onClick }: Props) {
  const isCritical = incident.severity === 'critical';
  const minutesAgo = dayjs().diff(dayjs(incident.occurredAt), 'minute');
  const isNew = minutesAgo < NEW_THRESHOLD_MINUTES;

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: isCritical ? '1px solid #DC262666' : '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isCritical ? '#DC2626aa' : 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        },
        ...(isCritical && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 3,
            backgroundColor: '#DC2626',
            animation: 'pulse 2s ease-in-out infinite',
          },
        }),
      }}
    >
      {/* 신규 배지 */}
      {isNew && (
        <Box
          sx={{
            position: 'absolute',
            top: isCritical ? 8 : 6,
            right: 8,
            zIndex: 1,
          }}
        >
          <Chip
            label="NEW"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              backgroundColor: '#10B981',
              color: '#fff',
              boxShadow: '0 0 8px #10B98166',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
      )}

      <CardActionArea onClick={() => onClick(incident)} sx={{ height: '100%' }}>
        <CardContent sx={{ pt: isCritical ? 2.5 : 2 }}>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1, pr: isNew ? 5 : 0 }}>
              <SeverityChip severity={incident.severity} />
              <StatusChip status={incident.status} />
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', ml: 1, flexShrink: 0 }}>
              {dayjs(incident.occurredAt).fromNow()}
            </Typography>
          </Box>

          {/* 서비스명 + 알람명 */}
          <Typography variant="subtitle2" fontWeight={700} mb={0.25} noWrap>
            {incident.serviceName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
            {incident.alarmName}
          </Typography>

          {/* 감지값 */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {detectTypeLabels[incident.detectType]} ({detectTermLabels[incident.detectTerm]})
            </Typography>
            <Typography variant="body1" fontWeight={700} color="error.main">
              {incident.thresholdValue.toLocaleString()}
              <Typography component="span" variant="caption" color="error.light" sx={{ ml: 0.25 }}>
                건
              </Typography>
            </Typography>
          </Box>

          {/* 임계값 대비 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.disabled">
              임계 {incident.threshold.toLocaleString()}건
            </Typography>
            {incident.clearYn && (
              <Chip label="해소" size="small" sx={{ height: 16, fontSize: '0.6rem', backgroundColor: '#10B98122', color: '#10B981', '& .MuiChip-label': { px: 0.5 } }} />
            )}
          </Box>

          {/* 클릭 힌트 */}
          <Typography
            variant="caption"
            color="primary.main"
            sx={{ display: 'block', mt: 1.5, opacity: 0.7, fontSize: '0.68rem' }}
          >
            클릭하여 상세 보기 →
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
