'use client';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
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

const NEW_THRESHOLD_MINUTES = 30;

interface Props {
  incident: Incident;
  onClick: (incident: Incident) => void;
}

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem', flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function IncidentWallCard({ incident, onClick }: Props) {
  const isCritical = incident.severity === 'fatal' || incident.severity === 'critical';
  const minutesAgo = dayjs().diff(dayjs(incident.occurredAt), 'minute');
  const isNew = minutesAgo < NEW_THRESHOLD_MINUTES;

  const metaTags = [
    incident.applNm ? { label: 'APP', value: incident.applNm } : null,
    incident.chId ? { label: '채널', value: incident.chId } : null,
    incident.logPoint ? { label: '로그', value: incident.logPoint } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const svcNmShort = incident.svcNm
    ? incident.svcNm.split('/').filter(Boolean).pop() ?? incident.svcNm
    : '';

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
      {isNew && (
        <Box sx={{ position: 'absolute', top: isCritical ? 8 : 6, right: 8, zIndex: 1 }}>
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
        <CardContent sx={{ pt: isCritical ? 2.5 : 2, pb: '12px !important' }}>

          {/* 헤더: 심각도+상태 / 탐지번호+시간 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1, pr: isNew ? 5 : 0 }}>
              <SeverityChip severity={incident.severity} />
              <StatusChip status={incident.status} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, ml: 1 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                #{incident.alarmHstSeq}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', fontSize: '0.62rem' }}>
                {dayjs(incident.occurredAt).fromNow()}
              </Typography>
            </Box>
          </Box>

          {/* 단위서비스 코드+명 */}
          <Typography variant="caption" color="primary.light" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.25 }}>
            ({incident.serviceId}) {incident.serviceName}
          </Typography>

          {/* 알람명 */}
          <Typography variant="subtitle2" fontWeight={700} mb={0.75} sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {incident.alarmName}
          </Typography>

          {/* APP / 채널 / 로그포인트 태그 */}
          {metaTags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
              {metaTags.map(({ label, value }) => (
                <Chip
                  key={label}
                  label={`${label}: ${value}`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'text.secondary',
                    border: '1px solid rgba(255,255,255,0.12)',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              ))}
            </Box>
          )}

          {/* 서비스명 (svc_nm) */}
          {svcNmShort && (
            <MetaTag label="서비스" value={svcNmShort} />
          )}

          {/* OP명 */}
          {incident.opNm && (
            <MetaTag label="OP" value={incident.opNm} />
          )}

          <Divider sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 검출기준 · 탐지주기 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {detectTypeLabels[incident.detectType] ?? incident.detectType}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>·</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {detectTermLabels[incident.detectTerm] ?? incident.detectTerm} 주기
            </Typography>
          </Box>

          {/* 탐지값 vs 임계값 */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="body2" fontWeight={700} color="error.main">
                {incident.thresholdValue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="error.light" sx={{ fontSize: '0.62rem' }}>건</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                임계 {incident.threshold.toLocaleString()}건
              </Typography>
              {incident.clearYn && (
                <Chip
                  label="해소"
                  size="small"
                  sx={{
                    height: 14,
                    fontSize: '0.58rem',
                    backgroundColor: '#10B98122',
                    color: '#10B981',
                    '& .MuiChip-label': { px: 0.5 },
                  }}
                />
              )}
            </Box>
          </Box>

          {/* 발생일시 */}
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.62rem' }}>
            발생: {dayjs(incident.occurredAt).format('MM-DD HH:mm')}
          </Typography>

        </CardContent>
      </CardActionArea>
    </Card>
  );
}
