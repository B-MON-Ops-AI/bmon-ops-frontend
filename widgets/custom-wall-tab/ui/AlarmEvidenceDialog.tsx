'use client';

/**
 * @file AlarmEvidenceDialog.tsx
 * @description AI 알람 제안 근거 내역 — 기준일 시간대별 실측(호출수·오류·응답)과 같은요일 평소값을 대조.
 *   운영자가 "제안이 언제·어떤 값에서 나왔는지" 직접 확인하도록 시각별 테이블로 보여준다.
 * @module widgets/custom-wall-tab/ui
 */

import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, ReferenceLine,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { useAlarmGapEvidence, useProposalInsight } from '@/features/alarm-conditions';
import type { AlarmGapProposal, AlarmGapEvidenceHour, AlarmGapEvidenceHistory, DetectType } from '@/entities/alarm-condition';

const DOW_LABEL: Record<string, string> = {
  '1': '일', '2': '월', '3': '화', '4': '수', '5': '목', '6': '금', '7': '토',
};

// detectType → 강조할 실측 컬럼
const METRIC_COL: Record<DetectType, keyof AlarmGapEvidenceHour> = {
  ERR_RATE: 'errRate', RPY_TIME: 'maxRpy', ERR_S: 'errS', ERR_E: 'errE', CALL_CASCNT: 'n',
};

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}
function fmtVal(v: number | null, unit: string): string {
  if (v == null) return '—';
  if (unit === '%') return `${v.toFixed(2)}%`;
  if (unit === 'ms') return fmtMs(v);
  return `${Math.round(v).toLocaleString()}건`;
}
const mmdd = (d: string | null): string => (d && d.length >= 10 ? d.slice(5).replace('-', '/') : d ?? '');

// ── 같은 요일 이력 미니바 (피크 시각, 기준일 강조 + 제안 임계선) ──
function HistoryBars({ history, unit, threshold, isBlw }: {
  history: AlarmGapEvidenceHistory[]; unit: string; threshold: number; isBlw: boolean;
}) {
  const maxScale = Math.max(threshold, ...history.map((h) => h.value)) || 1;
  const pct = (v: number) => `${Math.max((v / maxScale) * 100, 1.5)}%`;
  const isBreach = (v: number) => (isBlw ? v < threshold : v >= threshold);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {history.map((h) => {
        const color = h.isRef ? '#F87171' : isBreach(h.value) ? '#FB923C' : '#818CF8';
        return (
          <Box key={h.date} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ width: 46, flexShrink: 0, fontSize: '0.66rem', textAlign: 'right',
              color: h.isRef ? '#FCA5A5' : 'text.disabled', fontWeight: h.isRef ? 700 : 400 }}>
              {mmdd(h.date)}
            </Typography>
            {/* 바 트랙 + 제안 임계선 */}
            <Box sx={{ position: 'relative', flex: 1, height: 16, borderRadius: 0.5, backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(h.value),
                borderRadius: 0.5, backgroundColor: `${color}${h.isRef ? 'cc' : '99'}` }} />
              <Box sx={{ position: 'absolute', top: -2, bottom: -2, left: `${(threshold / maxScale) * 100}%`,
                width: '2px', backgroundColor: 'rgba(165,180,252,0.8)' }} />
            </Box>
            <Typography sx={{ width: 62, flexShrink: 0, fontSize: '0.66rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              color: h.isRef ? '#FCA5A5' : 'text.secondary', fontWeight: h.isRef ? 700 : 400 }}>
              {fmtVal(h.value, unit)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── 발동 포인트 미니차트 (기준일 시간대 값 + 임계선 + 초과 지점 빨강 점) ──
function TriggerChart({ hourly, unit, threshold, isBlw }: {
  hourly: AlarmGapEvidenceHour[]; unit: string; threshold: number; isBlw: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isBreach = (v: number) => (isBlw ? v < threshold : v >= threshold);
  const data = hourly.map((h) => ({
    time: `${h.time.slice(0, 2)}:${h.time.slice(2)}`,
    value: h.value,
    trig: isBreach(h.value) ? h.value : null,
  }));
  const tickFmt = (v: number) =>
    unit === 'ms' ? (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}`) : `${v}`;
  return (
    <Box sx={{ height: 170, mt: 0.5 }}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false} tickLine={false} tickFormatter={tickFmt} width={38} />
            <ReferenceLine y={threshold} stroke="#A5B4FC" strokeDasharray="4 3"
              label={{ value: `제안 임계 ${tickFmt(threshold)}${unit === '%' ? '%' : unit === 'ms' ? '' : unit}`,
                fill: '#A5B4FC', fontSize: 10, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="value" name="값" stroke="#38BDF8" strokeWidth={1.6} dot={false} />
            <Scatter dataKey="trig" name="발동" fill="#F87171" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

interface Props {
  proposal: AlarmGapProposal | null;
  onClose: () => void;
}

export default function AlarmEvidenceDialog({ proposal: p, onClose }: Props) {
  const params = p
    ? { svcNm: p.svcNm, opNm: p.opNm, domnId: p.domnId, detectType: p.detectType }
    : null;
  const { data, isLoading } = useAlarmGapEvidence(params);
  const { data: insight, isLoading: insightLoading } = useProposalInsight(
    p ? { svcNm: p.svcNm, opNm: p.opNm, domnId: p.domnId, detectType: p.detectType, thrs: p.proposedThreshold, comprType: p.comprType } : null,
  );

  if (!p) return null;

  const isBlw = p.comprType === 'COMPR_BLW';
  const metricCol = METRIC_COL[p.detectType];
  const hourly = data?.hourly ?? [];
  // 초과 판정: 이상(MRTH) value>=임계 / 이하(BLW) value<임계
  const isBreach = (v: number) => (isBlw ? v < p.proposedThreshold : v >= p.proposedThreshold);
  // 피크 시각 = 이상이면 최댓값, 이하면 최솟값
  const peakTime = hourly.length
    ? hourly.reduce((best, h) =>
        (isBlw ? h.value < best.value : h.value > best.value) ? h : best,
      hourly[0]).time
    : null;

  const dowLabel = data?.refDow ? DOW_LABEL[String(data.refDow)] ?? '' : '';

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1f2e', backgroundImage: 'none', border: '1px solid rgba(99,102,241,0.25)' } }}>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: '#A5B4FC', pb: 0.5 }}>
        제안 근거 내역
      </DialogTitle>
      <DialogContent>
        {/* 제안 컨텍스트 */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'text.primary', wordBreak: 'break-all' }}>
            {p.svcNm}<Typography component="span" sx={{ color: 'text.disabled', ml: 0.5 }}>· {p.opNm || '—'}</Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75, alignItems: 'center' }}>
            <Chip label={p.metric} size="small"
              sx={{ height: 18, fontSize: '0.6rem', backgroundColor: 'rgba(99,102,241,0.14)', color: '#A5B4FC', '& .MuiChip-label': { px: 0.7 } }} />
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              기준일 <b style={{ color: '#E2E8F0' }}>{data?.refDate ?? '—'}{dowLabel && `(${dowLabel})`}</b>
              {' · '}{isBlw ? '하한' : '제안'} 임계 <b style={{ color: '#A5B4FC' }}>{fmtVal(p.proposedThreshold, p.unit)}</b>
              {p.baseline != null && <> · 평소 {fmtVal(p.baseline, p.unit)}</>}
              {data?.baselineDays ? ` · 평소=같은요일 최근 ${data.baselineDays}일 평균` : ''}
            </Typography>
          </Box>
        </Box>

        {/* ── AI 요약 (근거 설명 + 임계 사유 + 리스크) ── */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, border: '1px solid rgba(99,102,241,0.25)', backgroundColor: 'rgba(99,102,241,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <AutoAwesomeIcon sx={{ fontSize: 15, color: '#818CF8' }} />
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#A5B4FC' }}>AI 요약</Typography>
            {insight && (
              <Chip label={insight.source === 'ai' ? 'AI 생성' : '규칙 기반'} size="small"
                sx={{ height: 16, fontSize: '0.55rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.disabled', '& .MuiChip-label': { px: 0.6 } }} />
            )}
            {insightLoading && <CircularProgress size={12} sx={{ color: '#818CF8' }} />}
          </Box>
          {insight ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              <Typography sx={{ fontSize: '0.74rem', color: 'text.primary', lineHeight: 1.55 }}>
                {insight.summary}
              </Typography>
              {insight.thresholdRationale && (
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.5 }}>
                  <Box component="span" sx={{ color: '#A5B4FC', fontWeight: 700 }}>임계 사유 </Box>
                  {insight.thresholdRationale}
                </Typography>
              )}
              {insight.risk && (
                <Typography sx={{ fontSize: '0.7rem', color: '#FBBF24', lineHeight: 1.5 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>주의 </Box>
                  {insight.risk}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
              {insightLoading ? '요약 생성 중…' : '요약을 불러오지 못했습니다.'}
            </Typography>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : hourly.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>기준일 시간대 데이터가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            {/* 같은 요일 이력 (피크 시각) — 다른 날 같은 요일엔 어땠는지 */}
            {(data?.history?.length ?? 0) > 0 && peakTime && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary' }}>
                    같은 요일 {dowLabel && `${dowLabel}요일 `}이력
                  </Typography>
                  <Chip label={`${peakTime.slice(0, 2)}:${peakTime.slice(2)} ${isBlw ? '최저' : '피크'}`} size="small"
                    sx={{ height: 17, fontSize: '0.58rem', fontWeight: 700, backgroundColor: 'rgba(248,113,113,0.14)', color: '#FCA5A5', '& .MuiChip-label': { px: 0.6 } }} />
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                    세로선=제안 임계 {fmtVal(p.proposedThreshold, p.unit)} · <Box component="span" sx={{ color: '#FCA5A5' }}>빨강=기준일</Box>
                  </Typography>
                </Box>
                <HistoryBars history={data!.history} unit={p.unit} threshold={p.proposedThreshold} isBlw={isBlw} />
                <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', mt: 0.75 }}>
                  다른 날 같은 요일 대비 기준일이 얼마나 벗어났는지 확인해 임계를 정하세요.
                </Typography>
              </Box>
            )}

            {/* 발동 포인트 — 기준일 시간대 값 + 임계선, 초과 지점(빨강)에서 알람 발동 */}
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary' }}>발동 포인트</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                  점선=제안 임계 · <Box component="span" sx={{ color: '#F87171' }}>빨강 점</Box>=이 시각에 알람이 발동됩니다
                </Typography>
              </Box>
              <TriggerChart hourly={hourly} unit={p.unit} threshold={p.proposedThreshold} isBlw={isBlw} />
            </Box>

            <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mb: 0.75 }}>
              기준일 시간대별 실측입니다. <Box component="span" sx={{ color: '#F87171', fontWeight: 700 }}>강조 행</Box>은 {isBlw ? '최저' : '피크'} 시각,
              <Box component="span" sx={{ color: '#A5B4FC', fontWeight: 700 }}> 파란 컬럼</Box>이 제안 지표({p.metric}),
              <Box component="span" sx={{ fontWeight: 700 }}> 평소</Box>는 같은 요일 그 시간대 평균(범위)입니다.
            </Typography>
            <Box sx={{ overflow: 'auto', maxHeight: 380, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 1.5 }}>
              <Box component="table" sx={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
                <Box component="thead">
                  <Box component="tr">
                    {['시각', '호출수', '오류(S)', '오류(E)', '오류율', '최대응답', '평소(범위)'].map((h, i) => (
                      <Box component="th" key={h}
                        sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'rgba(23,27,38,0.98)',
                          px: 1, py: 0.9, fontSize: '0.66rem', fontWeight: 700, color: 'text.disabled',
                          textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap',
                          borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {hourly.map((h) => {
                    const breach = isBreach(h.value);
                    const isPeak = h.time === peakTime;
                    const hi = (col: keyof AlarmGapEvidenceHour) => col === metricCol;
                    const cellSx = (col?: keyof AlarmGapEvidenceHour) => ({
                      px: 1, py: 0.8, fontSize: '0.7rem', whiteSpace: 'nowrap', textAlign: 'right' as const,
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      ...(col && hi(col) ? { color: '#A5B4FC', fontWeight: 700, backgroundColor: 'rgba(99,102,241,0.08)' } : {}),
                    });
                    return (
                      <Box component="tr" key={h.time}
                        sx={{ backgroundColor: isPeak ? 'rgba(248,113,113,0.10)' : 'transparent',
                          boxShadow: isPeak ? 'inset 3px 0 0 #F87171' : 'none' }}>
                        <Box component="td" sx={{ px: 1, py: 0.8, fontSize: '0.7rem', textAlign: 'left',
                          fontWeight: isPeak ? 700 : 400, color: isPeak ? '#FCA5A5' : 'text.secondary',
                          borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {`${h.time.slice(0, 2)}:${h.time.slice(2)}`}
                          {breach && (
                            <Chip label="초과" size="small"
                              sx={{ ml: 0.6, height: 15, fontSize: '0.54rem', fontWeight: 700,
                                backgroundColor: 'rgba(248,113,113,0.16)', color: '#F87171', '& .MuiChip-label': { px: 0.5 } }} />
                          )}
                        </Box>
                        <Box component="td" sx={{ ...cellSx('n'), color: hi('n') ? '#A5B4FC' : 'text.secondary' }}>
                          {h.n.toLocaleString()}
                        </Box>
                        <Box component="td" sx={{ ...cellSx('errS'), color: hi('errS') ? '#A5B4FC' : h.errS > 0 ? '#F87171' : 'text.disabled' }}>
                          {h.errS.toLocaleString()}
                        </Box>
                        <Box component="td" sx={{ ...cellSx('errE'), color: hi('errE') ? '#A5B4FC' : h.errE > 0 ? '#FB923C' : 'text.disabled' }}>
                          {h.errE.toLocaleString()}
                        </Box>
                        <Box component="td" sx={{ ...cellSx('errRate'), color: hi('errRate') ? '#A5B4FC' : h.errRate > 0 ? '#FB923C' : 'text.disabled' }}>
                          {h.errRate.toFixed(2)}%
                        </Box>
                        <Box component="td" sx={{ ...cellSx('maxRpy'), color: hi('maxRpy') ? '#A5B4FC' : h.maxRpy >= 5000 ? '#FB923C' : 'text.secondary' }}>
                          {fmtMs(h.maxRpy)}
                        </Box>
                        <Box component="td" sx={{ px: 1, py: 0.8, fontSize: '0.7rem', textAlign: 'right',
                          color: 'text.disabled', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Box sx={{ color: 'text.secondary' }}>{fmtVal(h.baseline, p.unit)}</Box>
                          {(h.baselineMin != null || h.baselineMax != null) && (
                            <Box sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>
                              {fmtVal(h.baselineMin, p.unit)}~{fmtVal(h.baselineMax, p.unit)}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: 'text.disabled', textTransform: 'none' }}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
