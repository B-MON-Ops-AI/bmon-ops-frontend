'use client';

/**
 * @file AlarmRegisterDialog.tsx
 * @description AI 알람 제안 → 값 수정 후 등록 다이얼로그
 *   운영 알람 등록 화면(examples-bmon-alarm)에 맞춰 비교유형(이상/이하)·활동창(탐지 시간대·요일)까지 편집.
 *   요일(detectDow)은 위치식 7자리 마스크(순서 월화수목금토일, 각 자리=요일숫자 2/3/4/5/6/7/1 또는 0).
 *   실데이터 확인: 2345671=전요일 · 2345670=월~토 · 2345600=평일.
 * @module widgets/custom-wall-tab/ui
 */

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useCreateAlarmCondition } from '@/features/alarm-conditions';
import type { AlarmGapProposal, AlarmLevel, DetectTerm, ComprType } from '@/entities/alarm-condition';

const LEVELS: AlarmLevel[] = ['Critical', 'Major', 'Minor'];
const TERMS: DetectTerm[] = ['MIN1', 'MIN5', 'MIN10', 'MIN30', 'HOUR1', 'DAY1'];
const TERM_LABEL: Record<DetectTerm, string> = {
  MIN1: '1분', MIN5: '5분', MIN10: '10분', MIN30: '30분', HOUR1: '1시간', DAY1: '1일',
};
const COMPR_LABEL: Record<ComprType, string> = {
  COMPR_MRTH: '이상(초과)', COMPR_BLW: '이하(미만)',
};
// 활동 요일 — 위치식 7자리 마스크(순서 월화수목금토일). 각 자리 = 활성이면 요일숫자, 아니면 '0'.
const DOW_DAYS: { label: string; digit: string }[] = [
  { label: '월', digit: '2' }, { label: '화', digit: '3' }, { label: '수', digit: '4' },
  { label: '목', digit: '5' }, { label: '금', digit: '6' }, { label: '토', digit: '7' },
  { label: '일', digit: '1' },
];
const ALL_DOW = DOW_DAYS.map((d) => d.digit);
const WEEKDAY_DOW = ['2', '3', '4', '5', '6'];
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
  const [alarmNm, setAlarmNm] = useState('');
  const [regrId, setRegrId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const thrsNum = Number(thrs);
  const thrsInvalid = !thrs || Number.isNaN(thrsNum) || thrsNum <= 0;
  const timeInvalid = !validHHmm(stTime) || !validHHmm(fnsTime);
  const dowInvalid = dow.length === 0;
  const invalid = thrsInvalid || timeInvalid || dowInvalid;
  const isCount = p.detectType === 'ERR_S' || p.detectType === 'ERR_E' || p.detectType === 'CALL_CASCNT';

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
        alarmNm: alarmNm.trim() || undefined,
        regrId: regrId.trim() || undefined,
      },
      { onSuccess: () => { onRegistered(); onClose(); } },
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1f2e', backgroundImage: 'none', border: '1px solid rgba(99,102,241,0.25)' } }}>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: '#A5B4FC', pb: 0.5 }}>
        AI 제안 알람 등록
      </DialogTitle>
      <DialogContent>
        {/* 제안 컨텍스트 (읽기 전용) */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'text.primary', wordBreak: 'break-all' }}>
            {p.svcNm}<Typography component="span" sx={{ color: 'text.disabled', ml: 0.5 }}>· {p.opNm || '—'}</Typography>
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.5 }}>
            {p.metric} · {p.comprType === 'COMPR_BLW' ? '평소' : '피크'} <b style={{ color: '#F87171' }}>{p.peak}{p.unit}</b>
            {p.baseline != null && p.comprType !== 'COMPR_BLW' && <> · 평소 {p.baseline}{p.unit}</>}
            {p.reasons?.length ? ` · ${p.reasons.join(', ')}` : ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="임계값" size="small" value={thrs}
              onChange={(e) => setThrs(e.target.value)}
              error={thrsInvalid} type="number"
              InputProps={{ endAdornment: <InputAdornment position="end">{p.unit}</InputAdornment> }}
              sx={{ ...fieldSx, flex: 1 }}
            />
            <TextField label="검출유형" size="small" value={p.detectType} disabled sx={{ ...fieldSx, flex: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField select label="비교유형" size="small" value={comprType}
              onChange={(e) => setComprType(e.target.value as ComprType)} sx={{ ...fieldSx, flex: 1 }}>
              {(Object.keys(COMPR_LABEL) as ComprType[]).map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{COMPR_LABEL[c]}</MenuItem>
              ))}
            </TextField>
            <TextField select label="등급" size="small" value={alarmLevel}
              onChange={(e) => setAlarmLevel(e.target.value as AlarmLevel)} sx={{ ...fieldSx, flex: 1 }}>
              {LEVELS.map((l) => <MenuItem key={l} value={l} sx={{ fontSize: '0.82rem' }}>{l}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <TextField select label="검출주기" size="small" value={detectTerm}
              onChange={(e) => setDetectTerm(e.target.value as DetectTerm)} sx={{ ...fieldSx, flex: 1 }}
              helperText={isCount ? '건수 임계는 창 기준(제안=1시간)' : ' '}
              FormHelperTextProps={{ sx: { fontSize: '0.62rem', mx: 0, color: 'text.disabled' } }}>
              {TERMS.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>{TERM_LABEL[t]}</MenuItem>)}
            </TextField>
            <Box sx={{ flex: 1 }} />
          </Box>

          {/* 상세 설정 (활동창) */}
          <Box>
            <Button
              onClick={() => setShowAdvanced((s) => !s)} size="small"
              endIcon={<ExpandMoreIcon sx={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
              sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem', px: 0.5 }}>
              상세 설정 (활동 시간대 · 요일)
            </Button>
            <Collapse in={showAdvanced}>
              <Box sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* 탐지 시간대 */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField label="탐지 시작(HHmm)" size="small" value={stTime}
                    onChange={(e) => setStTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    error={!validHHmm(stTime)} placeholder="0000" sx={{ ...fieldSx, flex: 1 }} />
                  <TextField label="탐지 종료(HHmm)" size="small" value={fnsTime}
                    onChange={(e) => setFnsTime(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    error={!validHHmm(fnsTime)} placeholder="2359" sx={{ ...fieldSx, flex: 1 }} />
                </Box>

                {/* 활동 요일 선택 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>활동 요일</Typography>
                    <Button size="small" onClick={() => setDow([...ALL_DOW])}
                      sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.62rem', textTransform: 'none', color: 'text.disabled', '&:hover': { color: '#A5B4FC' } }}>
                      전요일
                    </Button>
                    <Button size="small" onClick={() => setDow([...WEEKDAY_DOW])}
                      sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.62rem', textTransform: 'none', color: 'text.disabled', '&:hover': { color: '#A5B4FC' } }}>
                      평일
                    </Button>
                  </Box>
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
                </Box>

                <Typography sx={{ fontSize: '0.68rem', color: dowInvalid ? '#F87171' : 'text.disabled' }}>
                  {dowInvalid
                    ? '요일을 하나 이상 선택하세요.'
                    : `적용: ${dowSummary(dow)} · 시간대 ${fmtHHmm(stTime)}~${fmtHHmm(fnsTime)}`}
                  {!dowInvalid && p.comprType === 'COMPR_BLW' && ' · 저트래픽 시간대 오탐 방지를 위해 활동 시간대 확인'}
                </Typography>
              </Box>
            </Collapse>
          </Box>

          <TextField label="알람명 (비우면 자동 생성)" size="small" value={alarmNm}
            onChange={(e) => setAlarmNm(e.target.value)} sx={fieldSx}
            placeholder={`[AI제안][${p.svcNm} - ${p.opNm}] ${p.detectType} …`} />
          <TextField label="처리자 사번 (선택)" size="small" value={regrId}
            onChange={(e) => setRegrId(e.target.value)} sx={fieldSx} />
        </Box>

        {create.isError && (
          <Typography sx={{ fontSize: '0.72rem', color: '#F87171', mt: 1.5 }}>
            등록 실패 — 값을 확인하고 다시 시도해 주세요.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: 'text.disabled', textTransform: 'none' }}>취소</Button>
        <Button onClick={submit} disabled={invalid || create.isPending} variant="contained" size="small"
          sx={{ textTransform: 'none', backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4F46E5' } }}>
          {create.isPending ? '등록 중…' : '알람 등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
