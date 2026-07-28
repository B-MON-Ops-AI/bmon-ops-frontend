'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import ReactMarkdown from 'react-markdown';
import { useUpdateAlarmCondition } from '@/features/alarm-conditions';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { AlarmCondition, AlarmLevel, DetectTerm, TriggerStatus } from '@/entities/alarm-condition';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const LEVEL_CONFIG: Record<AlarmLevel, { label: string; color: string; bg: string }> = {
  Critical: { label: 'Critical', color: '#F87171', bg: 'rgba(239,68,68,0.1)' },
  Major:    { label: 'Major',    color: '#FB923C', bg: 'rgba(249,115,22,0.1)' },
  Minor:    { label: 'Minor',    color: '#FBBF24', bg: 'rgba(245,158,11,0.1)' },
};

const TRIGGER_CONFIG: Record<TriggerStatus, { label: string; color: string; bg: string; desc: string }> = {
  'no-trigger': { label: '미발생', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', desc: '30일간 발생 없음 — 임계값 검토 필요' },
  'normal':     { label: '정상',   color: '#34D399', bg: 'rgba(52,211,153,0.1)',  desc: '정상 범위 내 발생' },
  'frequent':   { label: '빈발',   color: '#FB923C', bg: 'rgba(249,115,22,0.1)',  desc: '발생 빈도 높음 — 임계값 재검토 권장' },
  'excessive':  { label: '과다',   color: '#F87171', bg: 'rgba(239,68,68,0.1)',   desc: '과다 발생 — 임계값이 너무 낮거나 알람 노이즈' },
};

const DETECT_TYPE_LABEL: Record<string, string> = {
  ERR_S: '시스템오류', ERR_E: '외부오류', ERR_RATE: '오류율(%)',
  RPY_TIME: '응답시간(ms)', CALL_CASCNT: '호출건수',
};
const DETECT_TERM_LABEL: Record<string, string> = {
  MIN1: '1분', MIN5: '5분', MIN10: '10분', MIN30: '30분', HOUR1: '1시간', DAY1: '1일',
};
const COMPR_LABEL: Record<string, string> = {
  COMPR_MRTH: '초과 시 발생',
  COMPR_BLW: '이하 시 발생',
};
const CH_LABEL: Record<string, string> = {
  UI: 'UI', EB: 'ESB', ME: '마이페이지', SI: 'SI채널',
  CO: '콜센터', IC: 'ICIS', BC: 'B2B CRM', RD: 'RDS', OM: 'OM시스템',
};
const HOLIDAY_LABEL: Record<string, string> = {
  H: '공휴일 제외', S: '공휴일 포함', '': '',
};

function formatDow(dow: string): string {
  if (!dow) return '—';
  if (dow === '2345671' || dow === '1234567') return '매일(월~일)';
  if (dow === '2345670') return '월~토';
  if (dow === '2345600' || dow === '23456') return '월~금';
  const MAP: Record<string, string> = { '1': '일', '2': '월', '3': '화', '4': '수', '5': '목', '6': '금', '7': '토' };
  return dow.split('').filter(d => d !== '0').map(d => MAP[d] ?? d).join(', ');
}

function formatTime(t: string): string {
  if (!t || t.length < 4) return '—';
  return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

// ── 정보 행 ────────────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75 }}>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', width: 86, flexShrink: 0, pt: 0.1 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
}

// ── 통계 박스 ──────────────────────────────────────────────────
function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Box sx={{
      flex: 1, textAlign: 'center', py: 1.5,
      borderRadius: 1.5,
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: color ?? 'text.primary', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── 섹션 제목 ──────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {children}
    </Typography>
  );
}

// ── 다이얼로그 ─────────────────────────────────────────────────
interface Props {
  cond: AlarmCondition | null;
  onClose: () => void;
  aiLoading: boolean;
  aiContent: string | null;
  onRequestAi: (cond: AlarmCondition) => void;
}

const DETECT_TERM_OPTIONS: DetectTerm[] = ['MIN1', 'MIN5', 'MIN10', 'MIN30', 'HOUR1', 'DAY1'];

export default function AlarmConditionDetailDrawer({ cond, onClose, aiLoading, aiContent, onRequestAi }: Props) {
  const dispatch = useAppDispatch();
  const { mutate: updateCond, isPending: saving } = useUpdateAlarmCondition();

  const [editing, setEditing] = useState(false);
  const [editThrs, setEditThrs] = useState('');
  const [editTerm, setEditTerm] = useState<DetectTerm>('MIN5');
  const [editUseYn, setEditUseYn] = useState<'Y' | 'N'>('Y');
  const [disposer, setDisposer] = useState('');
  // 저장 후 부모 cond가 갱신되기 전까지 표시값을 즉시 반영하기 위한 로컬 오버라이드
  const [override, setOverride] = useState<{ threshold: number; detectTerm: DetectTerm; useYn: 'Y' | 'N' } | null>(null);
  // 조건 변경 시 편집/오버라이드 초기화는 부모의 key={alarmId} 리마운트로 처리

  if (!cond) return null;

  // 표시값: 편집 저장 후에는 override 우선
  const viewThreshold = override?.threshold ?? cond.threshold;
  const viewTerm = override?.detectTerm ?? cond.detectTerm;
  const viewUseYn = override?.useYn ?? cond.useYn;

  const lc = LEVEL_CONFIG[cond.alarmLevel] ?? LEVEL_CONFIG['Minor'];
  const tc = TRIGGER_CONFIG[cond.triggerStatus] ?? TRIGGER_CONFIG['normal'];
  const canRequestAi = cond.triggerStatus === 'no-trigger' && viewUseYn === 'Y';

  const startEdit = () => {
    setEditThrs(String(viewThreshold));
    setEditTerm(viewTerm as DetectTerm);
    setEditUseYn(viewUseYn);
    setDisposer('');
    setEditing(true);
  };

  const handleSave = () => {
    const thrsNum = Number(editThrs);
    if (!Number.isFinite(thrsNum) || thrsNum <= 0) {
      dispatch(showSnackbar({ message: '임계값은 0보다 큰 숫자여야 합니다.', severity: 'error' }));
      return;
    }
    if (!disposer.trim()) {
      dispatch(showSnackbar({ message: '처리자 사번을 입력하세요.', severity: 'error' }));
      return;
    }
    updateCond(
      { alarmId: cond.alarmId, data: { thrs: thrsNum, detectTerm: editTerm, useYn: editUseYn, chgrId: disposer.trim() } },
      {
        onSuccess: () => {
          setOverride({ threshold: thrsNum, detectTerm: editTerm, useYn: editUseYn });
          setEditing(false);
          dispatch(showSnackbar({ message: '알람조건 설정이 변경됐습니다.', severity: 'success' }));
        },
        onError: () => dispatch(showSnackbar({ message: '변경에 실패했습니다.', severity: 'error' })),
      },
    );
  };

  const countColor = cond.triggerCount30d > 30 ? '#F87171'
    : cond.triggerCount30d > 10 ? '#FB923C'
    : cond.triggerCount30d === 0 ? '#64748B'
    : '#34D399';

  const hasPause = !!(cond.pauseStartDt || cond.pauseEndDt);
  const hasTarget = !!(cond.svcNm || cond.opNm || cond.chId);
  const hasDesc = !!(cond.alarmDesc?.trim());

  return (
    <Dialog
      open={!!cond}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── 헤더 ── */}
        <Box sx={{
          px: 2.5, py: 2,
          borderLeft: `3px solid ${lc.color}`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>
              {cond.alarmName}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25 }}>
              {cond.serviceName} · {cond.serviceId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            <Chip label={lc.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: lc.bg, color: lc.color, border: `1px solid ${lc.color}44`, '& .MuiChip-label': { px: 1 } }} />
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── 스크롤 영역 ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* 30일 통계 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <StatBox label="30일 발생" value={cond.triggerCount30d} color={countColor} />
            <StatBox label="미해소" value={cond.unresolvedCount} color={cond.unresolvedCount > 0 ? '#F87171' : undefined} />
          </Box>

          {/* 알람 설명 */}
          {hasDesc && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <SectionTitle>알람 설명</SectionTitle>
                <Box sx={{ px: 1.5, py: 1.25, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {cond.alarmDesc}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* 모니터링 대상 */}
          {hasTarget && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <SectionTitle>모니터링 대상</SectionTitle>
                <Box sx={{ borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.07)', px: 1.75, py: 0.5 }}>
                  {cond.chId && (
                    <>
                      <InfoRow label="채널">
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                          {CH_LABEL[cond.chId] ?? cond.chId}
                        </Typography>
                      </InfoRow>
                      {(cond.svcNm || cond.opNm) && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
                    </>
                  )}
                  {cond.svcNm && (
                    <>
                      <InfoRow label="서비스명">
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.primary', wordBreak: 'break-all', lineHeight: 1.5 }}>
                          {cond.svcNm}
                        </Typography>
                      </InfoRow>
                      {cond.opNm && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
                    </>
                  )}
                  {cond.opNm && (
                    <InfoRow label="오퍼레이션">
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', wordBreak: 'break-all' }}>
                        {cond.opNm}
                      </Typography>
                    </InfoRow>
                  )}
                </Box>
              </Box>
            </>
          )}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 조건 설정 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <SectionTitle>조건 설정</SectionTitle>
              {!editing && (
                <Tooltip title="임계값·검출주기·사용여부 편집" placement="left">
                  <IconButton
                    size="small"
                    onClick={startEdit}
                    sx={{ p: 0.4, color: '#818CF8', backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 1, '&:hover': { backgroundColor: 'rgba(99,102,241,0.16)' } }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ borderRadius: 1.5, border: `1px solid ${editing ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`, px: 1.75, py: 0.5 }}>
              <InfoRow label="검출 유형">
                <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                  {DETECT_TYPE_LABEL[cond.detectType] ?? cond.detectType}
                </Typography>
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="검출 주기">
                {editing ? (
                  <Select
                    value={editTerm}
                    onChange={(e) => setEditTerm(e.target.value as DetectTerm)}
                    size="small"
                    sx={{ fontSize: '0.78rem', height: 30, minWidth: 110, '& .MuiSelect-select': { py: 0.25 } }}
                  >
                    {DETECT_TERM_OPTIONS.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: '0.78rem' }}>
                        {DETECT_TERM_LABEL[t] ?? t}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                    {DETECT_TERM_LABEL[viewTerm] ?? viewTerm}
                  </Typography>
                )}
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="임계값">
                {editing ? (
                  <TextField
                    value={editThrs}
                    onChange={(e) => setEditThrs(e.target.value.replace(/[^0-9.]/g, ''))}
                    size="small"
                    inputMode="decimal"
                    placeholder="0"
                    sx={{ width: 120, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.78rem' } }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.primary', fontWeight: 600 }}>
                    {viewThreshold.toLocaleString()}
                    <Typography component="span" sx={{ fontSize: '0.65rem', color: 'text.disabled', ml: 0.5 }}>
                      / {DETECT_TERM_LABEL[viewTerm] ?? viewTerm}
                    </Typography>
                    {cond.comprType && (
                      <Typography component="span" sx={{ fontSize: '0.65rem', color: 'text.disabled', ml: 0.75 }}>
                        ({COMPR_LABEL[cond.comprType]})
                      </Typography>
                    )}
                  </Typography>
                )}
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="검출 요일">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                    {formatDow(cond.detectDow)}
                  </Typography>
                  {cond.detectHoliday && (
                    <Chip
                      label={HOLIDAY_LABEL[cond.detectHoliday]}
                      size="small"
                      sx={{ height: 16, fontSize: '0.6rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.disabled', border: '1px solid rgba(255,255,255,0.1)', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
                </Box>
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="검출 시간대">
                <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                  {formatTime(cond.detectStTime)} ~ {formatTime(cond.detectFnsTime)}
                </Typography>
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="발생 상태">
                <Tooltip title={tc.desc} placement="left">
                  <Chip label={tc.label} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: tc.bg, color: tc.color, border: `1px solid ${tc.color}33`, cursor: 'default', '& .MuiChip-label': { px: 0.75 } }} />
                </Tooltip>
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="활성 여부">
                {editing ? (
                  <Select
                    value={editUseYn}
                    onChange={(e) => setEditUseYn(e.target.value as 'Y' | 'N')}
                    size="small"
                    sx={{ fontSize: '0.78rem', height: 30, minWidth: 100, '& .MuiSelect-select': { py: 0.25 } }}
                  >
                    <MenuItem value="Y" sx={{ fontSize: '0.78rem' }}>활성</MenuItem>
                    <MenuItem value="N" sx={{ fontSize: '0.78rem' }}>비활성</MenuItem>
                  </Select>
                ) : (
                  <Chip
                    label={viewUseYn === 'Y' ? '활성' : '비활성'}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.62rem', fontWeight: 600,
                      backgroundColor: viewUseYn === 'Y' ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.08)',
                      color: viewUseYn === 'Y' ? '#34D399' : '#64748B',
                      border: `1px solid ${viewUseYn === 'Y' ? 'rgba(52,211,153,0.25)' : 'rgba(148,163,184,0.15)'}`,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </InfoRow>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              <InfoRow label="최근 발생">
                <Typography sx={{ fontSize: '0.78rem', color: cond.latestTriggerAt ? 'text.secondary' : 'text.disabled' }}>
                  {cond.latestTriggerAt ? dayjs(cond.latestTriggerAt).fromNow() : '—'}
                </Typography>
              </InfoRow>

              {editing && (
                <>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                  <InfoRow label="처리자 사번">
                    <TextField
                      value={disposer}
                      onChange={(e) => setDisposer(e.target.value)}
                      size="small"
                      placeholder="예: 82000001"
                      sx={{ width: 160, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.78rem' } }}
                    />
                  </InfoRow>
                </>
              )}
            </Box>

            {editing && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.25 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  sx={{ minWidth: 64, fontSize: '0.72rem' }}
                >
                  취소
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 72, fontSize: '0.72rem' }}
                >
                  {saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : '저장'}
                </Button>
              </Box>
            )}
          </Box>

          {/* 관리 이력 */}
          {(cond.regDt || cond.chgDt || hasPause) && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <SectionTitle>관리 이력</SectionTitle>
                <Box sx={{ borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.07)', px: 1.75, py: 0.5 }}>
                  {cond.regDt && (
                    <>
                      <InfoRow label="등록일시">
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {dayjs(cond.regDt).format('YYYY-MM-DD HH:mm')}
                        </Typography>
                      </InfoRow>
                      {(cond.chgDt || hasPause) && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
                    </>
                  )}
                  {cond.chgDt && (
                    <>
                      <InfoRow label="최근 변경">
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {dayjs(cond.chgDt).format('YYYY-MM-DD HH:mm')}
                        </Typography>
                      </InfoRow>
                      {hasPause && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
                    </>
                  )}
                  {hasPause && (
                    <InfoRow label="일시정지">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#F59E0B' }}>
                          {cond.pauseStartDt ? dayjs(cond.pauseStartDt).format('MM/DD HH:mm') : '—'}
                          {' ~ '}
                          {cond.pauseEndDt ? dayjs(cond.pauseEndDt).format('MM/DD HH:mm') : '—'}
                        </Typography>
                      </Box>
                    </InfoRow>
                  )}
                </Box>
              </Box>
            </>
          )}

          {/* AI 의견 섹션 */}
          {canRequestAi && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <SectionTitle>AI 분석 의견</SectionTitle>
                  <Tooltip title={aiContent ? 'AI 의견 다시 요청' : 'AI 의견 요청'} placement="left">
                    <IconButton
                      size="small"
                      onClick={() => onRequestAi(cond)}
                      disabled={aiLoading}
                      sx={{
                        p: 0.5,
                        color: (aiContent || aiLoading) ? '#818CF8' : '#6366F1',
                        backgroundColor: (aiContent || aiLoading) ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                        border: `1px solid ${(aiContent || aiLoading) ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.2)'}`,
                        borderRadius: 1,
                        '&:hover': { color: '#A5B4FC', backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.45)' },
                      }}
                    >
                      {aiLoading
                        ? <CircularProgress size={13} sx={{ color: '#818CF8' }} />
                        : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {aiLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderRadius: 1.5, backgroundColor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <CircularProgress size={12} sx={{ color: '#818CF8' }} />
                    <Typography sx={{ fontSize: '0.73rem', color: 'text.disabled' }}>분석 중...</Typography>
                  </Box>
                )}

                {!aiLoading && !aiContent && (
                  <Box sx={{ px: 1.5, py: 1.25, borderRadius: 1.5, backgroundColor: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                      AI 버튼을 눌러 분석을 요청하세요
                    </Typography>
                  </Box>
                )}

                {aiContent && (
                  <Box sx={{
                    px: 1.75, py: 1.5, borderRadius: 1.5,
                    backgroundColor: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.75,
                    '& p': { m: 0, mb: 0.5 }, '& ul, & ol': { pl: 2, my: 0.5 },
                    '& li': { mb: 0.25 }, '& strong': { color: 'text.primary', fontWeight: 600 },
                    '& h2, & h3': { fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', mt: 1, mb: 0.5 },
                  }}>
                    <ReactMarkdown>{aiContent}</ReactMarkdown>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>

        {/* ── 푸터 ── */}
        <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
            알람 ID: {cond.alarmId}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
