'use client';

/**
 * @file AlarmRegisterDialog.tsx
 * @description AI 알람 제안 → 값 수정 후 등록 다이얼로그
 *   운영 알람 등록 화면(examples-bmon-alarm)에 맞춰 기본정보/상세설정 2단 구획 +
 *   알람설명·사용여부·공휴일 처리·활동창(시간대·요일) + 요약 문장까지 편집.
 *   요일(detectDow)은 위치식 7자리 마스크(순서 월화수목금토일, 각 자리=요일숫자 2/3/4/5/6/7/1 또는 0).
 *   실데이터 확인: 2345671=전요일 · 2345670=월~토 · 2345600=평일.
 * @module widgets/custom-wall-tab/ui
 */

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useCreateAlarmCondition } from '@/features/alarm-conditions';
import type { AlarmGapProposal, AlarmLevel, DetectTerm, DetectType, ComprType, DetectHoliday } from '@/entities/alarm-condition';

const LEVELS: AlarmLevel[] = ['Fatal', 'Critical', 'Major', 'Minor'];
// 헤더 좌측 accent — 알람조건 상세 드로어와 동일한 등급 색상
const LEVEL_COLOR: Record<AlarmLevel, string> = {
  Fatal: '#EF4444', Critical: '#F87171', Major: '#FB923C', Minor: '#FBBF24',
};
const TERMS: DetectTerm[] = ['MIN1', 'MIN5', 'MIN10', 'MIN30', 'HOUR1', 'DAY1'];
const TERM_LABEL: Record<DetectTerm, string> = {
  MIN1: '1분', MIN5: '5분', MIN10: '10분', MIN30: '30분', HOUR1: '1시간', DAY1: '1일',
};
const COMPR_LABEL: Record<ComprType, string> = {
  COMPR_MRTH: '이상(초과)', COMPR_BLW: '이하(미만)',
};
const DETECT_LABEL: Record<DetectType, string> = {
  ERR_S: '시스템오류', ERR_E: '비즈니스 오류', ERR_RATE: '오류율(%)',
  RPY_TIME: '응답시간(ms)', CALL_CASCNT: '호출수',
};
// 공휴일 처리 — mo_alarm_cond.detect_holiday 실제 도메인('' / H / S)
const HOLIDAYS: { value: DetectHoliday; label: string }[] = [
  { value: 'S', label: '공휴일 포함' },
  { value: 'H', label: '공휴일 제외' },
  { value: '', label: '미적용' },
];
// 활동 요일 — 위치식 7자리 마스크(순서 월화수목금토일). 각 자리 = 활성이면 요일숫자, 아니면 '0'.
const DOW_DAYS: { label: string; digit: string }[] = [
  { label: '월', digit: '2' }, { label: '화', digit: '3' }, { label: '수', digit: '4' },
  { label: '목', digit: '5' }, { label: '금', digit: '6' }, { label: '토', digit: '7' },
  { label: '일', digit: '1' },
];
const ALL_DOW = DOW_DAYS.map((d) => d.digit);
const WEEKDAY_DOW = ['2', '3', '4', '5', '6'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// 마스크 → 활성 요일숫자 집합 (없으면 전요일로 폴백)
const parseDow = (mask: string): string[] => {
  const on = DOW_DAYS.filter((d) => (mask || '').includes(d.digit)).map((d) => d.digit);
  return on.length ? on : [...ALL_DOW];
};
// 활성 요일숫자 집합 → 위치식 마스크
const buildDow = (sel: string[]): string =>
  DOW_DAYS.map((d) => (sel.includes(d.digit) ? d.digit : '0')).join('');
// 사람이 읽는 요약
const dowSummary = (sel: string[]): string => {
  if (sel.length === 0) return '없음';
  if (sel.length >= 7) return '전요일';
  if (sel.length === 5 && WEEKDAY_DOW.every((d) => sel.includes(d))) return '평일';
  return DOW_DAYS.filter((d) => sel.includes(d.digit)).map((d) => d.label).join('·');
};
// HHmm 4자리 검증
const validHHmm = (v: string): boolean => {
  if (!/^\d{4}$/.test(v)) return false;
  const hh = Number(v.slice(0, 2));
  const mm = Number(v.slice(2));
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
};
const fmtHHmm = (v: string): string => (validHHmm(v) ? `${v.slice(0, 2)}:${v.slice(2)}` : v);

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.82rem',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(99,102,241,0.6)' },
  },
  '& .MuiInputLabel-root': { fontSize: '0.8rem' },
} as const;

// 레거시 알람정보 화면과 통일된 섹션 헤더 (◉ 라벨 ──── 구분선)
function SectionHeader({ title, required }: { title: string; required?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 1.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #818CF8', flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>
        {title}
        {required && (
          <Typography component="span" sx={{ fontSize: '0.66rem', color: 'text.disabled', ml: 0.75, fontWeight: 400 }}>
            ( * 표시는 필수 )
          </Typography>
        )}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
    </Box>
  );
}

interface Props {
  proposal: AlarmGapProposal;
  onClose: () => void;
  onRegistered: () => void;
}

export default function AlarmRegisterDialog({ proposal: p, onClose, onRegistered }: Props) {
  const create = useCreateAlarmCondition();
  const [thrs, setThrs] = useState(String(p.proposedThreshold));
  const [alarmLevel, setAlarmLevel] = useState<AlarmLevel>(p.alarmLevel);
  const [detectTerm, setDetectTerm] = useState<DetectTerm>(p.detectTerm ?? 'MIN5');
  const [comprType, setComprType] = useState<ComprType>(p.comprType ?? 'COMPR_MRTH');
  const [stTime, setStTime] = useState(p.detectStTime ?? '0000');
  const [fnsTime, setFnsTime] = useState(p.detectFnsTime ?? '2359');
  const [dow, setDow] = useState<string[]>(() => parseDow(p.detectDow));
  const [holiday, setHoliday] = useState<DetectHoliday>('S');
  const [alarmNm, setAlarmNm] = useState('');
  const [alarmDesc, setAlarmDesc] = useState('');
  const [useYn, setUseYn] = useState<'Y' | 'N'>('Y');
  const [regrId, setRegrId] = useState('');

  const thrsNum = Number(thrs);
  const thrsInvalid = !thrs || Number.isNaN(thrsNum) || thrsNum <= 0;
  const timeInvalid = !validHHmm(stTime) || !validHHmm(fnsTime);
  const dowInvalid = dow.length === 0;
  const invalid = thrsInvalid || timeInvalid || dowInvalid;
  const isCount = p.detectType === 'ERR_S' || p.detectType === 'ERR_E' || p.detectType === 'CALL_CASCNT';
  const levelColor = LEVEL_COLOR[alarmLevel] ?? LEVEL_COLOR.Minor;
  const direction = comprType === 'COMPR_BLW' ? '이하' : '이상';

  // 시/분 드롭다운 ↔ HHmm 동기화
  const setHour = (setter: (v: string) => void, cur: string, h: string) => setter(h + cur.slice(2, 4));
  const setMin = (setter: (v: string) => void, cur: string, m: string) => setter(cur.slice(0, 2) + m);

  const submit = () => {
    if (invalid) return;
    create.mutate(
      {
        svcNm: p.svcNm,
        opNm: p.opNm,
        detectType: p.detectType,
        thrs: thrsNum,
        alarmLevel,
        detectTerm,
        comprType,
        detectDow: buildDow(dow),
        detectStTime: stTime,
        detectFnsTime: fnsTime,
        detectHoliday: holiday,
        useYn,
        alarmNm: alarmNm.trim() || undefined,
        alarmDesc: alarmDesc.trim() || undefined,
        regrId: regrId.trim() || undefined,
      },
      { onSuccess: () => { onRegistered(); onClose(); } },
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { backgroundColor: 'background.paper', backgroundImage: 'none' } }}>
      {/* ── 헤더 (알람조건 상세와 통일: 등급색 좌측 accent + 서브타이틀 + 닫기) ── */}
      <Box sx={{
        px: 2.5, py: 2,
        borderLeft: `3px solid ${levelColor}`,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <AutoAwesomeIcon sx={{ fontSize: 15, color: '#818CF8' }} />
            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: 'text.primary' }}>
              AI 제안 알람 등록
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {p.svcNm} · {p.opNm || '—'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {/* 제안 근거 (읽기 전용) */}
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.18)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <AutoAwesomeIcon sx={{ fontSize: 13, color: '#818CF8' }} />
            <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: '#A5B4FC', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              AI 제안 근거
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {p.metric} · {p.comprType === 'COMPR_BLW' ? '평소' : '피크'} <b style={{ color: '#F87171' }}>{p.peak}{p.unit}</b>
            {p.baseline != null && p.comprType !== 'COMPR_BLW' && <> · 평소 {p.baseline}{p.unit}</>}
            {p.reasons?.length
              ? ` · ${p.reasons.map((r) => r.replace(/(?:평소\s*대비\s*)?z\s*=\s*\d+(?:\.\d+)?/gi, '평소 범위를 벗어남')).join(', ')}`
              : ''}
          </Typography>
        </Box>

        {/* ══ 기본정보 ══ */}
        <SectionHeader title="기본정보" required />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField label="알람명 (비우면 자동 생성)" size="small" value={alarmNm}
              onChange={(e) => setAlarmNm(e.target.value)} sx={{ ...fieldSx, flex: 1 }}
              placeholder={`[AI제안][${p.svcNm} - ${p.opNm}] ${p.detectType} …`} />
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0,
              px: 1.25, height: 40, borderRadius: 1, border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>사용여부</Typography>
              <Switch size="small" checked={useYn === 'Y'}
                onChange={(e) => setUseYn(e.target.checked ? 'Y' : 'N')} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: useYn === 'Y' ? '#34D399' : '#64748B', minWidth: 28 }}>
                {useYn === 'Y' ? '사용' : '중지'}
              </Typography>
            </Box>
          </Box>

          <TextField label="알람설명" size="small" value={alarmDesc}
            onChange={(e) => setAlarmDesc(e.target.value)} sx={fieldSx}
            multiline minRows={2} maxRows={4}
            placeholder="비우면 알람명으로 대체됩니다." />

          {/* 요일 설정 + 공휴일 처리 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>요일 설정 *</Typography>
              <Button size="small" onClick={() => setDow([...ALL_DOW])}
                sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.62rem', textTransform: 'none', color: 'text.disabled', '&:hover': { color: '#A5B4FC' } }}>
                전요일
              </Button>
              <Button size="small" onClick={() => setDow([...WEEKDAY_DOW])}
                sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.62rem', textTransform: 'none', color: 'text.disabled', '&:hover': { color: '#A5B4FC' } }}>
                평일
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <ToggleButtonGroup
                value={dow}
                onChange={(_, v: string[]) => setDow(v)}
                size="small"
                sx={{
                  flexWrap: 'wrap', gap: 0.5,
                  '& .MuiToggleButton-root': {
                    width: 38, height: 32, fontSize: '0.74rem', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px !important', color: 'text.secondary', textTransform: 'none',
                    '&.Mui-selected': {
                      color: '#A5B4FC', backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.5)',
                      '&:hover': { backgroundColor: 'rgba(99,102,241,0.26)' },
                    },
                  },
                }}
              >
                {DOW_DAYS.map((d) => (
                  <ToggleButton key={d.digit} value={d.digit}>{d.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>공휴일</Typography>
                <ToggleButtonGroup
                  exclusive
                  value={holiday}
                  onChange={(_, v: DetectHoliday | null) => { if (v !== null) setHoliday(v); }}
                  size="small"
                  sx={{
                    gap: 0.5,
                    '& .MuiToggleButton-root': {
                      height: 32, px: 1.25, fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px !important', color: 'text.secondary', textTransform: 'none',
                      '&.Mui-selected': {
                        color: '#A5B4FC', backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.5)',
                        '&:hover': { backgroundColor: 'rgba(99,102,241,0.26)' },
                      },
                    },
                  }}
                >
                  {HOLIDAYS.map((h) => (
                    <ToggleButton key={h.value || 'none'} value={h.value}>{h.label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Box>
            {dowInvalid && (
              <Typography sx={{ fontSize: '0.68rem', color: '#F87171', mt: 0.75 }}>
                요일을 하나 이상 선택하세요.
              </Typography>
            )}
          </Box>
        </Box>

        {/* ══ 상세설정 ══ */}
        <SectionHeader title="상세설정" required />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
          <TextField label="검출유형" size="small" value={DETECT_LABEL[p.detectType] ?? p.detectType}
            disabled sx={fieldSx} helperText={p.detectType} FormHelperTextProps={{ sx: { fontSize: '0.62rem', mx: 0, color: 'text.disabled' } }} />
          <TextField select label="검출주기 *" size="small" value={detectTerm}
            onChange={(e) => setDetectTerm(e.target.value as DetectTerm)} sx={fieldSx}
            helperText={isCount ? '건수 임계는 창 기준(제안=1시간)' : ' '}
            FormHelperTextProps={{ sx: { fontSize: '0.62rem', mx: 0, color: 'text.disabled' } }}>
            {TERMS.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>{TERM_LABEL[t]}</MenuItem>)}
          </TextField>

          <TextField label="설정값(임계값) *" size="small" value={thrs}
            onChange={(e) => setThrs(e.target.value)}
            error={thrsInvalid} type="number"
            InputProps={{ endAdornment: <InputAdornment position="end">{p.unit}</InputAdornment> }}
            sx={fieldSx} />
          <TextField select label="비교유형 *" size="small" value={comprType}
            onChange={(e) => setComprType(e.target.value as ComprType)} sx={fieldSx}>
            {(Object.keys(COMPR_LABEL) as ComprType[]).map((c) => (
              <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{COMPR_LABEL[c]}</MenuItem>
            ))}
          </TextField>

          <TextField select label="알람등급 *" size="small" value={alarmLevel}
            onChange={(e) => setAlarmLevel(e.target.value as AlarmLevel)} sx={fieldSx}>
            {LEVELS.map((l) => <MenuItem key={l} value={l} sx={{ fontSize: '0.82rem' }}>{l}</MenuItem>)}
          </TextField>
          <TextField label="처리자 사번 (선택)" size="small" value={regrId}
            onChange={(e) => setRegrId(e.target.value)} sx={fieldSx} />
        </Box>

        {/* 탐지 시간대 (시/분 드롭다운) */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mb: 0.75 }}>탐지 시간설정 *</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField select size="small" value={stTime.slice(0, 2)} error={!validHHmm(stTime)}
              onChange={(e) => setHour(setStTime, stTime, e.target.value)} sx={{ ...fieldSx, width: 84 }}>
              {HOURS.map((h) => <MenuItem key={h} value={h} sx={{ fontSize: '0.82rem' }}>{h}시</MenuItem>)}
            </TextField>
            <TextField select size="small" value={stTime.slice(2, 4)} error={!validHHmm(stTime)}
              onChange={(e) => setMin(setStTime, stTime, e.target.value)} sx={{ ...fieldSx, width: 84 }}>
              {MINUTES.map((m) => <MenuItem key={m} value={m} sx={{ fontSize: '0.82rem' }}>{m}분</MenuItem>)}
            </TextField>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled', px: 0.5 }}>~</Typography>
            <TextField select size="small" value={fnsTime.slice(0, 2)} error={!validHHmm(fnsTime)}
              onChange={(e) => setHour(setFnsTime, fnsTime, e.target.value)} sx={{ ...fieldSx, width: 84 }}>
              {HOURS.map((h) => <MenuItem key={h} value={h} sx={{ fontSize: '0.82rem' }}>{h}시</MenuItem>)}
            </TextField>
            <TextField select size="small" value={fnsTime.slice(2, 4)} error={!validHHmm(fnsTime)}
              onChange={(e) => setMin(setFnsTime, fnsTime, e.target.value)} sx={{ ...fieldSx, width: 84 }}>
              {MINUTES.map((m) => <MenuItem key={m} value={m} sx={{ fontSize: '0.82rem' }}>{m}분</MenuItem>)}
            </TextField>
          </Box>
        </Box>

        {/* 요약 문장 (레거시 알람정보 화면의 자연어 요약) */}
        <Box sx={{
          px: 1.75, py: 1.5, borderRadius: 1.5,
          backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#C7D2FE', lineHeight: 1.7 }}>
            탐지시간 <b>{fmtHHmm(stTime)}~{fmtHHmm(fnsTime)}</b>내
            {' '}<b>{dowSummary(dow)}</b> <b>{TERM_LABEL[detectTerm]}</b> 동안{' '}
            <b>{p.svcNm}{p.opNm ? ` · ${p.opNm}` : ''}</b>에서{' '}
            <b>{DETECT_LABEL[p.detectType] ?? p.detectType}</b>이(가)
            {' '}설정값(<b style={{ color: '#F87171' }}>{thrsInvalid ? '—' : thrsNum.toLocaleString()}{p.unit}</b>)보다{' '}
            <b>{direction}</b>인 경우{' '}
            <b style={{ color: levelColor }}>{alarmLevel}</b> 등급의 알람 발생
          </Typography>
        </Box>

        {create.isError && (
          <Box
            sx={{
              mt: 1.5, px: 1.25, py: 1, borderRadius: 1,
              display: 'flex', alignItems: 'center', gap: 0.75,
              backgroundColor: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.3)',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 16, color: '#F87171', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.72rem', color: '#F87171' }}>
              등록에 실패했습니다. 값을 확인하고 다시 시도해 주세요.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: 'text.disabled', textTransform: 'none' }}>닫기</Button>
        <Button onClick={submit} disabled={invalid || create.isPending} variant="contained" size="small"
          sx={{ textTransform: 'none', backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4F46E5' } }}>
          {create.isPending ? '등록 중…' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
