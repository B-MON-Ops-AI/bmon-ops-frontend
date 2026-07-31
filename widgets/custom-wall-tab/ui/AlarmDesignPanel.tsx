'use client';

/**
 * @file AlarmDesignPanel.tsx
 * @description 커스텀 Wall 알람 설계 탭 — 임계값 결정·등록 전용.
 *   모니터링(이동창)과 달리 **항상 byhr 축적 통계 기준**(최신일 시간대 peak vs 최근 28일 같은요일 baseline)이며
 *   기간 토글과 무관하다. AI 공백 제안 + 서비스별 peak 목록 + 등록 다이얼로그.
 *   모니터링 목록에서 알람 아이콘을 누르면 focusSvc로 전달되어 해당 서비스 등록 다이얼로그가 바로 열린다.
 * @module widgets/custom-wall-tab/ui
 */

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAlarmGaps } from '@/features/alarm-conditions';
import type { AlarmGapProposal } from '@/entities/alarm-condition';
import type { DomainMetrics, DomainBreakdownItem } from '@/entities/dashboard';
import AlarmGapPanel from './AlarmGapPanel';
import BreakdownTable from './BreakdownTable';
import AlarmRegisterDialog from './AlarmRegisterDialog';

interface DesignFilters {
  svcQuery: string;
}

// ── byhr 최신일 시간대 peak 로 수동 알람 제안 기본값 생성 (AI 공백 제안이 없을 때) ──
// ⚠ 이동창(현재창) 값이 아니라 peakErrorRate/peakMaxResponseMs(축적 통계)만 사용 → 기간 토글과 무관.
function levelByRate(v: number): AlarmGapProposal['alarmLevel'] {
  return v >= 50 ? 'Critical' : v >= 20 ? 'Major' : 'Minor';
}
function levelByRpy(v: number): AlarmGapProposal['alarmLevel'] {
  return v >= 10000 ? 'Critical' : v >= 5000 ? 'Major' : 'Minor';
}
function manualProposal(b: DomainBreakdownItem, domnId: string): AlarmGapProposal {
  const base = {
    svcNm: b.name, opNm: b.opName, domnId, type: '수동',
    baseline: null as number | null, breachHits: 0,
    detectTerm: 'HOUR1' as const, detectDow: '2345670',
    detectStTime: '0800', detectFnsTime: '1900',  // 업무시간(08:00~19:00) 기본
    reasons: ['운영자 지정 (최신일 시간대 peak 기준 기본값)'],
  };
  const er = b.peakErrorRate ?? 0;
  const rpy = b.peakMaxResponseMs ?? 0;
  if (er >= 0.5) {
    return { ...base, metric: '오류율', detectType: 'ERR_RATE', comprType: 'COMPR_MRTH',
      unit: '%', peak: er, proposedThreshold: Math.min(100, Math.max(Math.ceil(er * 1.5), 5)),
      alarmLevel: levelByRate(er) };
  }
  if (rpy >= 3000) {
    return { ...base, metric: '최대응답', detectType: 'RPY_TIME', comprType: 'COMPR_MRTH',
      unit: 'ms', peak: rpy,
      proposedThreshold: Math.max(Math.round((rpy * 1.2) / 100) * 100, 5000),
      alarmLevel: levelByRpy(rpy) };
  }
  // peak 근거가 약하면 최소 오류율 임계로 폴백
  return { ...base, metric: '오류율', detectType: 'ERR_RATE', comprType: 'COMPR_MRTH',
    unit: '%', peak: er, proposedThreshold: 5, alarmLevel: 'Minor' };
}

const fmtAsOf = (d: string | null | undefined): string | null =>
  d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : (d ?? null);

// 탭 동작 설명 (통계 용어 없이 평문)
const HOW_STEPS: { title: string; body: string }[] = [
  {
    title: '무엇을 정하는 곳인가요',
    body: "서비스마다 '이 값을 넘으면(또는 밑돌면) 알림'이라는 기준값(임계값)을 정해 등록하는 곳입니다.",
  },
  {
    title: '무엇과 비교해 판단하나요',
    body: '최근 4주간 같은 요일·같은 시간대의 평소 값과 비교합니다. 요일·시간대별 패턴을 반영해 "평소와 얼마나 다른가"로 판단합니다. (모니터링 탭의 10분/1시간 토글과는 무관합니다.)',
  },
  {
    title: 'AI 알람 제안이란',
    body: '아직 알람이 없는 서비스 중, 평소와 크게 달라진 지표를 자동으로 골라 추천합니다. 각 제안의 "근거 내역"에서 그날 시간대별 실측과 "같은 요일 다른 날" 값을 직접 확인할 수 있습니다.',
  },
  {
    title: '등록하면 어떻게 동작하나요',
    body: '설정한 조건(초과/미만)에 해당하는 값이 관측되면 알람이 발생합니다. 제안값은 그대로 쓰기보다 검토·수정 후 등록하는 것을 권장합니다.',
  },
];

interface Props {
  metrics: DomainMetrics;
  filters: DesignFilters;
  /** 모니터링에서 넘어온 포커스 서비스 (등록 다이얼로그 자동 오픈) */
  focusSvc: { name: string; opName: string } | null;
  onFocusConsumed: () => void;
}

export default function AlarmDesignPanel({ metrics: m, filters, focusSvc, onFocusConsumed }: Props) {
  const { data: gaps } = useAlarmGaps();
  const [registerProposal, setRegisterProposal] = useState<AlarmGapProposal | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(true);

  const aiBySvc = useMemo(() => {
    const map = new Map<string, AlarmGapProposal>();
    (gaps?.proposals ?? []).forEach((p) => {
      const k = `${p.svcNm}|${p.opNm}`;
      if (!map.has(k)) map.set(k, p);
    });
    return map;
  }, [gaps]);
  const aiKeys = useMemo(() => new Set(aiBySvc.keys()), [aiBySvc]);

  const openAlarm = (b: DomainBreakdownItem) => {
    const ai = aiBySvc.get(`${b.name}|${b.opName}`);
    setRegisterProposal(ai ?? manualProposal(b, m.domainId));
  };

  // 모니터링 → 설계 전환: 포커스 서비스 등록 다이얼로그 자동 오픈 + 행 강조
  useEffect(() => {
    if (!focusSvc) return;
    const k = `${focusSvc.name}|${focusSvc.opName}`;
    setFocusKey(k);
    const item = m.breakdown.find((b) => b.name === focusSvc.name && b.opName === focusSvc.opName);
    if (item) setRegisterProposal(aiBySvc.get(k) ?? manualProposal(item, m.domainId));
    onFocusConsumed();
    // aiBySvc/m는 의도적으로 deps 제외 — focusSvc 트리거 시점 스냅샷으로 1회 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSvc]);

  // 공통 필터(서비스 검색) 적용
  const q = filters.svcQuery.trim().toLowerCase();
  const filteredBreakdown = useMemo(
    () =>
      q
        ? m.breakdown.filter(
            (b) => b.name.toLowerCase().includes(q) || (b.opName ?? '').toLowerCase().includes(q),
          )
        : m.breakdown,
    [m.breakdown, q],
  );

  const asOf = fmtAsOf(gaps?.asOf ?? m.peakAsOf);
  const baselineDays = gaps?.baselineDays ?? 28;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* ── 이 탭은 어떻게 동작하나요 (친절 설명, 접이식) ── */}
      <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.22)', backgroundColor: 'rgba(99,102,241,0.04)' }}>
        <Box
          onClick={() => setHelpOpen((o) => !o)}
          sx={{ px: 1.75, py: 1.1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
        >
          <HelpOutlineIcon sx={{ fontSize: 16, color: '#818CF8' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC' }}>
            이 탭은 어떻게 동작하나요?
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', flex: 1 }}>
            알람 임계를 정하는 기준과 순서를 안내합니다.
          </Typography>
          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.disabled', transform: helpOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </Box>
        <Collapse in={helpOpen}>
          <Box sx={{ px: 1.75, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {HOW_STEPS.map((s, i) => (
              <Box key={s.title} sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flexShrink: 0, width: 18, height: 18, mt: 0.1, borderRadius: '50%',
                  backgroundColor: 'rgba(99,102,241,0.18)', color: '#A5B4FC',
                  fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i + 1}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.5 }}>
                    {s.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.55 }}>
                    {s.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* ── 근거 기간 배지 (기간 토글 무관, 항상 축적 통계 기준임을 명시) ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={<ScheduleIcon sx={{ fontSize: '13px !important', color: '#818CF8 !important' }} />}
          label={
            asOf
              ? `근거: 최신일 ${asOf} 시간대 peak · 최근 ${baselineDays}일 같은요일 baseline`
              : `근거: 최신일 시간대 peak · 최근 ${baselineDays}일 같은요일 baseline`
          }
          size="small"
          sx={{
            height: 22, fontSize: '0.66rem', fontWeight: 600,
            backgroundColor: 'rgba(99,102,241,0.12)', color: '#A5B4FC',
            border: '1px solid rgba(99,102,241,0.25)', '& .MuiChip-label': { px: 0.75 },
          }}
        />
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
          모니터링 탭의 기간 토글(10분/1시간)과 무관합니다.
        </Typography>
      </Box>

      {/* ── AI 알람 공백 제안 ── */}
      <AlarmGapPanel domainId={m.domainId} />

      {/* ── 서비스별 알람 설계 목록 (byhr 최신일 시간대 peak) ── */}
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
        <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
            서비스별 알람 설계
          </Typography>
          <Chip label="최신일 시간대 peak" size="small"
            sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8', '& .MuiChip-label': { px: 0.75 } }} />
          {q && (
            <Chip label={`${filteredBreakdown.length}/${m.breakdown.length}`} size="small"
              sx={{ height: 16, fontSize: '0.58rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
          )}
        </Box>
        <Box sx={{ px: 1.75, pt: 0.75 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1.6 }}>
            peak오류율·peak응답은 <Box component="span" sx={{ fontWeight: 700 }}>최신일 시간대 최고값</Box>으로, 임계 결정의 근거입니다.
            {' · '}행 <Box component="span" sx={{ color: '#A5B4FC' }}>알람 아이콘(🔔)</Box>으로 값을 검토·수정해 등록하세요.
            {' · '}<Box component="span" sx={{ color: '#A5B4FC' }}>AI 제안 서비스</Box>는 peak가 없어도 항상 표시됩니다.
          </Typography>
        </Box>
        {filteredBreakdown.length === 0 ? (
          <Box sx={{ px: 1.75, py: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
              {q ? '검색과 일치하는 서비스가 없습니다.' : '표시할 서비스가 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <BreakdownTable
            items={filteredBreakdown}
            aiKeys={aiKeys}
            onAlarm={openAlarm}
            selectedKey={focusKey}
            variant="design"
          />
        )}
      </Box>

      {/* 등록 다이얼로그 */}
      {registerProposal && (
        <AlarmRegisterDialog
          key={`${registerProposal.svcNm}|${registerProposal.opNm}|${registerProposal.detectType}`}
          proposal={registerProposal}
          onClose={() => setRegisterProposal(null)}
          onRegistered={() => setRegisterProposal(null)}
        />
      )}
    </Box>
  );
}
