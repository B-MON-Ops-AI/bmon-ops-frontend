'use client';

/**
 * @file IncidentDetailDrawer.tsx
 * @description 인시던트 상세 다이얼로그 (좌: 오류 요약, 우: AI Chat + 분석 탭)
 * @module features/incidents/ui
 */

import { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HistoryIcon from '@mui/icons-material/History';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InsightsIcon from '@mui/icons-material/Insights';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import ReactMarkdown from 'react-markdown';
import { SeverityChip, StatusChip, EmptyState, LoadingState, ErrorState } from '@/shared/ui';
import ResolveDialog from './ResolveDialog';
import { useAIAnalysis, useRequestAnalysis } from '@/features/incidents/model/useAI';
import { useResolveIncident } from '@/features/incidents/model/useIncidents';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { Incident } from '@/entities/incident';
import { chatApi } from '@/features/chat/api/chat.api';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const detectTypeLabels: Record<string, string> = {
  ERR_S: '시스템오류', RPY_TIME: '응답시간(ms)',
  ERR_RATE: '오류율(%)', ERR_E: '비즈니스 오류', CALL_CASCNT: '호출수',
};
const detectTermLabels: Record<string, string> = {
  MIN1: '1분', MIN5: '5분', MIN10: '10분', HOUR1: '1시간', DAY1: '1일',
};

// ── 채팅 메시지 타입 ──────────────────────────────────────
interface ChatMsg {
  role: 'user' | 'ai';
  content: string;
}

// ── 신뢰도 바 ───────────────────────────────────────────

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#3B82F6';
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ flex: 1, pr: 2 }}>{label}</Typography>
        <Typography variant="body2" fontWeight={700} color={color}>{pct}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6, borderRadius: 3,
          backgroundColor: `${color}22`,
          '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

// ── 유사 사례 카드 ──────────────────────────────────────

function SimilarCaseCard({
  sc, index,
}: {
  sc: { date: string; alarmName: string; serviceName: string; thresholdValue: number; clearYn: boolean; resolution?: string };
  index: number;
}) {
  const isFirst = index === 0;

  return (
    <Box
      sx={{
        p: 2.5, borderRadius: 2,
        border: isFirst ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
        backgroundColor: isFirst ? 'rgba(99,102,241,0.06)' : '#1a2233',
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: isFirst ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: isFirst ? '#6366F1' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.6rem', color: '#fff' }}>{index + 1}</Typography>
          </Box>
          {isFirst && <Chip label="가장 유사" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#6366F122', color: '#818CF8', border: '1px solid #6366F133', '& .MuiChip-label': { px: 0.75 } }} />}
          {sc.clearYn && <Chip label="자동해소" size="small" sx={{ height: 16, fontSize: '0.55rem', backgroundColor: '#10B98122', color: '#10B981', '& .MuiChip-label': { px: 0.5 } }} />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">{sc.date}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{sc.alarmName}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <Typography variant="caption" color="text.disabled">{sc.serviceName}</Typography>
        <Typography variant="caption" color="text.disabled">·</Typography>
        <Typography variant="caption" color="warning.main">{sc.thresholdValue.toLocaleString()}건</Typography>
      </Box>
      {sc.resolution && (
        <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#10B98112', border: '1px solid #10B98130' }}>
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
            <LightbulbIcon sx={{ fontSize: 15, color: '#10B981', mt: 0.2, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: 'block', mb: 0.25 }}>해결 방법</Typography>
              <Typography variant="body2" color="success.light" sx={{ lineHeight: 1.6 }}>{sc.resolution}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── 상세 정보 헬퍼 ─────────────────────────────────────

// 알람조건 상세 드로어와 통일: 라벨 폭 86 · value 0.78rem · text.primary
function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, py: 0.75, alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', width: 86, flexShrink: 0, pt: 0.1 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          flex: 1, fontSize: '0.78rem', lineHeight: 1.5, wordBreak: 'break-all',
          color: mono ? '#a5b4fc' : 'text.primary',
          ...(mono && { fontFamily: 'monospace' }),
        }}
      >
        {String(value)}
      </Typography>
    </Box>
  );
}

// 알람조건 상세와 통일: 섹션마다 테두리 박스로 그룹핑 + 표시되는 행끼리만 구분선.
// (값이 없어 null을 반환한 InfoRow는 DOM에 렌더되지 않으므로 CSS 형제 선택자로 구분선을 자동 처리)
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', mb: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>
        {title}
      </Typography>
      <Box
        sx={{
          borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.07)', px: 1.75, py: 0.5,
          '& > *': { borderTop: '1px solid rgba(255,255,255,0.04)' },
          '& > *:first-of-type': { borderTop: 'none' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// ── 알람 식별 블록 ─────────────────────────────────────
// 인시던트를 특정하는 핵심 식별자(시퀀스·알람 ID)를 상단 카드로 격상 + 복사 지원.

function IdentityField({
  label, value, onCopy,
}: {
  label: string; value: string | number; onCopy: (v: string, label: string) => void;
}) {
  const text = String(value);
  return (
    <Box
      sx={{
        flex: 1, minWidth: 0,
        px: 1.25, py: 0.75, borderRadius: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 0.15,
      }}
    >
      <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#a5b4fc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </Typography>
        <Tooltip title="복사">
          <IconButton size="small" onClick={() => onCopy(text, label)}
            sx={{ p: 0.25, ml: 'auto', color: 'text.disabled', '&:hover': { color: '#a5b4fc' } }}>
            <ContentCopyIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

function IdentityBlock({
  seq, alarmId, onCopy,
}: {
  seq: string | number; alarmId?: string | number | null; onCopy: (v: string, label: string) => void;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <FingerprintIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled"
          sx={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
          알람 식별
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IdentityField label="시퀀스" value={`#${seq}`} onCopy={onCopy} />
        {alarmId != null && alarmId !== '' && (
          <IdentityField label="알람 ID" value={alarmId} onCopy={onCopy} />
        )}
      </Box>
    </Box>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────

interface Props {
  incident: Incident | null;
  onClose: () => void;
}

export default function IncidentDetailDrawer({ incident, onClose }: Props) {
  const dispatch = useAppDispatch();
  const open = !!incident;
  const [resolveOpen, setResolveOpen] = useState(false);
  const [aiTab, setAiTab] = useState(0); // 0=Chat, 1=유사사례, 2=원인분석, 3=권장조치, 4=발생패턴

  // Chat 상태
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: analysis, isLoading: analysisLoading } = useAIAnalysis(incident?.id ?? null);
  const { mutate: requestAnalysis, isPending: requesting } = useRequestAnalysis();
  const { mutate: resolve, isPending: resolving } = useResolveIncident();

  // 드로어 열릴 때 분석 자동 시작
  useEffect(() => {
    if (open && incident && !analysisLoading && !analysis && !requesting) {
      requestAnalysis(incident.id, { onError: () => {} });
    }
  }, [open, incident?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 새 인시던트 열 때 초기화
  useEffect(() => {
    if (open) {
      setAiTab(0);
      setChatMessages([]);
      setChatInput('');
    }
  }, [incident?.id, open]);

  // Chat 스크롤 하단 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!incident) return null;

  const isCritical = incident.severity === 'fatal' || incident.severity === 'critical';
  const result = analysis?.status === 'completed' ? analysis.result : null;

  const handleResolve = (resolution: string, disposerId: string) =>
    resolve({ incidentId: incident.id, resolution, disposerId }, {
      onSuccess: () => { setResolveOpen(false); dispatch(showSnackbar({ message: '인시던트가 해결되었습니다.', severity: 'success' })); },
      onError: () => dispatch(showSnackbar({ message: '처리에 실패했습니다.', severity: 'error' })),
    });

  const handleReanalyze = () =>
    requestAnalysis(incident.id, {
      onError: () => dispatch(showSnackbar({ message: 'AI 분석 요청에 실패했습니다.', severity: 'error' })),
    });

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard?.writeText(value).then(
      () => dispatch(showSnackbar({ message: `${label} 복사됨: ${value}`, severity: 'success' })),
      () => dispatch(showSnackbar({ message: '복사에 실패했습니다.', severity: 'error' })),
    );
  };

  // ── Chat 전송 (백엔드 AI 연동) ─────────────────────────
  // incident별 고유 세션을 사용하여 알람 컨텍스트가 다른 대화와 섞이지 않도록 함
  const incidentSessionId = incident ? `incident-${incident.alarmHstSeq}` : 'incident-unknown';

  const handleChatSend = async () => {
    const query = chatInput.trim();
    if (!query || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: query }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await chatApi.query({
        query,
        session_id: incidentSessionId,
        alarm_hst_seq: incident?.alarmHstSeq ? Number(incident.alarmHstSeq) : undefined,
      });
      setChatMessages((prev) => [...prev, { role: 'ai', content: response.answer.summary }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'AI 분석 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // ── AI 로딩·진행·실패 상태 ──────────────────────────────
  const renderAIStatus = () => {
    if (analysisLoading) {
      return <LoadingState variant="spinner" label="분석 불러오는 중..." />;
    }
    if (!analysis || analysis.status === 'pending' || analysis.status === 'in_progress' || requesting) {
      const progress = analysis?.progress ?? 0;
      const step = analysis?.currentStep ?? 'AI 분석을 준비 중입니다...';
      return <LoadingState variant="linear" label={step} progress={progress > 0 ? progress : undefined} />;
    }
    if (analysis.status === 'failed') {
      return (
        <ErrorState
          dense
          title="분석에 실패했습니다"
          description="AI 분석을 다시 요청할 수 있습니다."
          onRetry={handleReanalyze}
        />
      );
    }
    return null;
  };

  // ── 탭 콘텐츠 렌더 ─────────────────────────────────────
  const renderTabContent = () => {
    // Chat 탭 (항상 사용 가능)
    if (aiTab === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 메시지 영역 */}
          <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {chatMessages.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                {/* 알람 컨텍스트 로드 안내 */}
                <Box
                  sx={{
                    width: '100%',
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 16, color: '#818CF8', mt: 0.1, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="#818CF8" fontWeight={600} display="block" mb={0.25}>
                      알람 컨텍스트 로드됨
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      #{incident.alarmHstSeq} · {incident.alarmName}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                      {incident.serviceName}
                    </Typography>
                  </Box>
                </Box>
                {/* 질문 안내 */}
                <Box sx={{ textAlign: 'center' }}>
                  <PsychologyIcon sx={{ fontSize: 36, color: 'rgba(99,102,241,0.3)', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    이 알람에 대해 AI에게 질문하세요
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    예: &quot;반복 발생 원인은?&quot;, &quot;임계값 조정 방법은?&quot;
                  </Typography>
                </Box>
              </Box>
            )}
            {chatMessages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '85%',
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: msg.role === 'user' ? '#6366F122' : '#1a2233',
                    border: msg.role === 'user' ? '1px solid #6366F133' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {msg.role === 'ai' ? (
                    <Box sx={{
                      '& p': { m: 0, mb: 1, lineHeight: 1.7, fontSize: '0.85rem', '&:last-child': { mb: 0 } },
                      '& strong': { color: '#818CF8', fontWeight: 700 },
                      '& h2': { fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', mt: 1.5, mb: 0.5, '&:first-of-type': { mt: 0 } },
                      '& h3': { fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', mt: 1, mb: 0.5 },
                      '& ul, & ol': { pl: 2.5, my: 0.5 },
                      '& li': { fontSize: '0.85rem', lineHeight: 1.7, mb: 0.25 },
                      '& table': { width: '100%', borderCollapse: 'collapse', my: 1, fontSize: '0.8rem' },
                      '& th': { textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.15)', pb: 0.5, pr: 1.5, color: '#94a3b8', fontWeight: 600 },
                      '& td': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 0.5, pr: 1.5, color: '#e2e8f0' },
                      '& code': { backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', px: 0.5, borderRadius: '3px', fontSize: '0.8rem' },
                      '& blockquote': { borderLeft: '3px solid #6366F1', pl: 1.5, ml: 0, my: 1, color: '#94a3b8', fontStyle: 'italic' },
                      '& hr': { border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', my: 1 },
                    }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{msg.content}</Typography>
                  )}
                </Box>
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.disabled">답변 생성 중...</Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* 입력 영역 */}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="이 인시던트에 대해 질문하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              disabled={chatLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a2233',
                  fontSize: '0.875rem',
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              sx={{ backgroundColor: '#6366F122', '&:hover': { backgroundColor: '#6366F133' } }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      );
    }

    // 나머지 탭은 분석 완료 후만 표시
    if (!result) {
      const aiStatus = renderAIStatus();
      if (aiStatus) return aiStatus;
      return null;
    }

    // 유사 사례 탭
    if (aiTab === 1) {
      if (result.similarCases.length === 0) {
        return (
          <EmptyState
            icon={<HistoryIcon />}
            title="유사 사례를 찾지 못했습니다"
            description="이 인시던트는 처음 발생하는 유형일 수 있습니다."
          />
        );
      }
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" color="text.disabled">총 {result.similarCases.length}건의 유사 사례가 발견되었습니다.</Typography>
            <Chip label="과거 이력 기반" size="small" sx={{ fontSize: '0.6rem', height: 16, backgroundColor: 'rgba(99,102,241,0.12)', color: '#818CF8', '& .MuiChip-label': { px: 0.75 } }} />
          </Box>
          {result.similarCases.map((sc: { date: string; alarmName: string; serviceName: string; thresholdValue: number; clearYn: boolean; resolution?: string }, i: number) => (
            <SimilarCaseCard key={i} sc={sc} index={i} />
          ))}
        </Box>
      );
    }

    // 원인 분석 탭
    if (aiTab === 2) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography variant="caption" color="text.disabled" mb={0.5}>{result.whyHappened.length}개 원인 요소 · 신뢰도 기반 정렬</Typography>
          {result.whyHappened.map((cause: { cause: string; confidence: number }, i: number) => (
            <ConfidenceBar key={i} value={cause.confidence} label={cause.cause} />
          ))}
        </Box>
      );
    }

    // 권장 조치 탭
    if (aiTab === 3) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography variant="caption" color="text.disabled" mb={0.5}>우선순위 순으로 정렬된 조치 항목입니다.</Typography>
          {result.recommendedActions.map((action: string, i: number) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 1.5, backgroundColor: '#1a2233', border: '1px solid #10B98122', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', backgroundColor: '#10B98122', border: '1px solid #10B98155', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.1, flexShrink: 0 }}>
                <Typography variant="caption" fontWeight={800} color="success.main" sx={{ fontSize: '0.65rem' }}>{i + 1}</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{action}</Typography>
            </Box>
          ))}
        </Box>
      );
    }

    // 발생 패턴 탭
    if (aiTab === 4 && result.alarmPattern) {
      const p = result.alarmPattern as { totalOccurrences: number; autoClearRate: number; avgClearMinutes: number; peakHour: string; peakDayOfWeek: string; recentTrend: string };
      const trendLabel = p.recentTrend === 'increasing' ? '증가 추세' : p.recentTrend === 'decreasing' ? '감소 추세' : '안정';
      const trendColor = p.recentTrend === 'increasing' ? '#EF4444' : p.recentTrend === 'decreasing' ? '#10B981' : '#6B7280';
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="caption" color="text.disabled" mb={0.5}>동일 알람의 과거 발생 패턴을 분석한 결과입니다.</Typography>
          {[
            { label: '총 발생 횟수', value: `${p.totalOccurrences}회` },
            { label: '자동 해소율', value: `${p.autoClearRate}%` },
            { label: '평균 해소 시간', value: p.avgClearMinutes > 0 ? `${p.avgClearMinutes}분` : '해소 이력 없음' },
            { label: '피크 시간대', value: p.peakHour },
            { label: '피크 요일', value: p.peakDayOfWeek },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 1.5, backgroundColor: '#1a2233', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 1.5, backgroundColor: '#1a2233', border: `1px solid ${trendColor}33` }}>
            <Typography variant="body2" color="text.secondary">최근 추세</Typography>
            <Typography variant="body2" fontWeight={700} color={trendColor}>{trendLabel}</Typography>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#111827',
            backgroundImage: 'none',
            border: isCritical ? '1px solid #DC262666' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            height: '85vh',
            maxHeight: '85vh',
          },
        }}
      >
        {/* ── 다이얼로그 헤더 ── */}
        <Box
          sx={{
            px: 3, py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: isCritical ? '#DC262608' : '#0d1117',
            display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0,
          }}
        >
          {isCritical && (
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#DC2626', boxShadow: '0 0 8px #DC2626', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
          )}
          <SeverityChip severity={incident.severity} />
          <StatusChip status={incident.status} />
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{incident.serviceName}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* ── 메인 2-패널 ── */}
        <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden', flex: 1, minHeight: 0 }}>
          <Grid container sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>

            {/* ── 좌측: 알람 상세 정보 ── */}
            <Grid item xs={12} md={4}
              sx={{
                borderRight: { md: '1px solid rgba(255,255,255,0.08)' },
                borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', md: 'none' },
                display: 'flex', flexDirection: 'column',
                minHeight: 0, maxHeight: '100%',
              }}
            >
              {/* 상단 고정: 발생값 요약 */}
              <Box sx={{ px: 3, pt: 2.5, pb: 2, flexShrink: 0 }}>
                <Typography variant="caption" color="text.disabled"
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                  {detectTypeLabels[incident.detectType]} · {detectTermLabels[incident.detectTerm]}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.75 }}>
                  <Typography variant="h3" fontWeight={800} color="error.main" sx={{ lineHeight: 1 }}>
                    {incident.thresholdValue.toLocaleString()}
                  </Typography>
                  <Typography variant="h6" color="error.light">건</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                  <Chip label={`임계 ${incident.threshold.toLocaleString()}건`} size="small"
                    sx={{ backgroundColor: '#EF444422', color: '#EF4444', fontWeight: 700, fontSize: '0.72rem' }} />
                  {incident.clearYn && (
                    <Chip label="자동해소" size="small"
                      sx={{ backgroundColor: '#10B98122', color: '#10B981', fontWeight: 700, fontSize: '0.72rem' }} />
                  )}
                  <StatusChip status={incident.status} />
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

              {/* 중간 스크롤: 상세 데이터 */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2, minHeight: 0 }}>

                <IdentityBlock seq={incident.alarmHstSeq} alarmId={incident.alarmId} onCopy={handleCopy} />

                <DetailSection title="서비스 정보">
                  <InfoRow label="단위서비스" value={`${incident.serviceId} (${incident.serviceName})`} />
                  {incident.applNm && <InfoRow label="APP명" value={incident.applNm} />}
                  {incident.svcNm && <InfoRow label="서비스명" value={incident.svcNm} />}
                  {incident.opNm && <InfoRow label="OP명" value={incident.opNm} />}
                  {incident.chId && <InfoRow label="채널 ID" value={incident.chId} />}
                  {incident.logPoint && <InfoRow label="로그 포인트" value={incident.logPoint} />}
                </DetailSection>

                <DetailSection title="알람 설정">
                  <InfoRow label="알람명" value={incident.alarmName} />
                  {incident.alarmDesc && <InfoRow label="알람 설명" value={incident.alarmDesc} />}
                  {incident.alarmContent && <InfoRow label="알람 내용" value={incident.alarmContent} />}
                  <InfoRow label="검출 유형" value={detectTypeLabels[incident.detectType] ?? incident.detectType} />
                  <InfoRow label="탐지 주기" value={`${detectTermLabels[incident.detectTerm] ?? incident.detectTerm} 주기`} />
                  <InfoRow label="임계값" value={`${incident.threshold.toLocaleString()}건`} />
                  <InfoRow label="알람 등급" value={incident.severity} />
                </DetailSection>

                <DetailSection title="발생 정보">
                  <InfoRow label="발생 시각" value={dayjs(incident.occurredAt).format('YYYY-MM-DD HH:mm:ss')} />
                  <InfoRow label="발생 후 경과" value={dayjs(incident.occurredAt).fromNow()} />
                  <InfoRow label="자동해소 여부" value={incident.clearYn ? '예' : '아니오'} />
                  {incident.clearDt && <InfoRow label="해소 시각" value={dayjs(incident.clearDt).format('YYYY-MM-DD HH:mm:ss')} />}
                  {typeof incident.changePercent === 'number' && incident.changePercent !== 0 && (
                    <InfoRow label="변화율" value={`${incident.changePercent > 0 ? '+' : ''}${incident.changePercent}%`} />
                  )}
                </DetailSection>

                {(incident.resolvedBy || incident.resolution) && (
                  <DetailSection title="해결 이력">
                    {incident.resolvedBy && <InfoRow label="처리자" value={incident.resolvedBy} />}
                    {incident.resolvedAt && <InfoRow label="처리 시각" value={dayjs(incident.resolvedAt).format('YYYY-MM-DD HH:mm:ss')} />}
                    {incident.resolution && (
                      <Box sx={{ mt: 0.75, p: 1.25, borderRadius: 1, backgroundColor: '#10B98110', border: '1px solid #10B98130' }}>
                        <Typography variant="caption" color="success.main" sx={{ fontSize: '0.72rem', lineHeight: 1.6 }}>
                          {incident.resolution}
                        </Typography>
                      </Box>
                    )}
                  </DetailSection>
                )}

              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

              {/* 하단 고정: 해결 완료 처리 */}
              <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
                {incident.status !== 'resolved' ? (
                  <Button fullWidth variant="outlined" startIcon={<DoneAllIcon />}
                    onClick={() => setResolveOpen(true)} color="success"
                    sx={{ justifyContent: 'flex-start' }}>
                    해결 완료 처리
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 1.5, backgroundColor: '#10B98110', border: '1px solid #10B98130' }}>
                    <DoneAllIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      해결 완료된 인시던트입니다
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* ── 우측: AI Chat + 분석 탭 ── */}
            <Grid item xs={12} md={8}
              sx={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117', overflow: 'hidden', minHeight: 0, maxHeight: '100%' }}
            >
              {/* 탭 헤더 */}
              <Box sx={{ px: 3, pt: 2, pb: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>AI 분석</Typography>
                    {analysis?.status === 'completed' && (
                      <Chip label="완료" size="small" sx={{ backgroundColor: '#10B98122', color: '#10B981', fontSize: '0.65rem', height: 18 }} />
                    )}
                  </Box>
                  {analysis?.status === 'completed' && (
                    <Tooltip title="재분석">
                      <IconButton size="small" onClick={handleReanalyze} disabled={requesting}>
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Tabs
                  value={aiTab}
                  onChange={(_, v) => setAiTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 36,
                    '& .MuiTabs-indicator': { backgroundColor: '#6366F1', height: 2 },
                    '& .MuiTab-root': {
                      minHeight: 36, py: 0, px: 1.5,
                      fontSize: '0.78rem', fontWeight: 500,
                      color: 'text.disabled',
                      '&.Mui-selected': { color: '#818CF8', fontWeight: 700 },
                    },
                  }}
                >
                  <Tab icon={<ChatIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="AI Chat" />
                  <Tab
                    icon={<HistoryIcon sx={{ fontSize: 15 }} />}
                    iconPosition="start"
                    disabled={!result}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        유사 사례
                        {result && result.similarCases.length > 0 && (
                          <Box sx={{ minWidth: 16, height: 16, px: 0.25, borderRadius: '8px', backgroundColor: aiTab === 1 ? '#6366F1' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, lineHeight: 1, color: '#fff' }}>{result.similarCases.length}</Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Tab icon={<PsychologyIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="원인 분석" disabled={!result} />
                  <Tab icon={<TaskAltIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="권장 조치" disabled={!result} />
                  <Tab icon={<InsightsIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="발생 패턴" disabled={!result} />
                </Tabs>
              </Box>

              {/* 탭 콘텐츠 */}
              <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 3 }}>
                {renderTabContent()}
              </Box>
            </Grid>

          </Grid>
        </DialogContent>
      </Dialog>

      <ResolveDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onConfirm={handleResolve}
        isPending={resolving}
        recommendedActions={result?.recommendedActions}
        isAnalysisLoading={analysisLoading || requesting}
      />
    </>
  );
}
