'use client';

/**
 * @file IncidentDetailDrawer.tsx
 * @description 인시던트 상세 다이얼로그 (해결 정보 및 추천 질문 복구 버전)
 */

import { useEffect, useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanIcon from '@mui/icons-material/Lan';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { SeverityChip, StatusChip } from '@/shared/ui';
import { useSendChat } from '@/features/chat';
import { useAckIncident } from '@/features/incidents/model/useIncidents';
import type { Incident } from '@/entities/incident';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const metricLabels: Record<string, string> = {
  error_rate: '에러율', response_time: '응답시간', traffic: '트래픽', request_count: '요청수',
};
const metricUnits: Record<string, string> = {
  error_rate: '%', response_time: 'ms', traffic: 'req/s', request_count: 'req',
};

interface Message { id: string; role: 'user' | 'assistant'; content: string; createdAt: string; }

interface Props { incident: Incident | null; onClose: () => void; }

export default function IncidentDetailDrawer({ incident, onClose }: Props) {
  const open = !!incident;
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: sendChat, isPending: isChatting } = useSendChat();
  const { mutate: ack, isPending: acking } = useAckIncident();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatting]);

  useEffect(() => {
    if (open && incident) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `안녕하세요! **${incident.unitServiceName}** 분석 에이전트입니다.`,
        createdAt: new Date().toISOString(),
      }]);
    }
  }, [incident?.id, open]);

  if (!incident) return null;

  const isResolved = incident.status === 'resolved';
  const isOpen     = incident.status === 'open';
  const isCritical = incident.severity === 'critical';

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isChatting) return;
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    sendChat({ query: `[Incident: ${incident.id}] ${text}` }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.answer.summary, createdAt: new Date().toISOString() }]);
      }
    });
  };

  const scrollContainerStyle = {
    flex: 1, minHeight: 0, overflowY: 'auto',
    '&::-webkit-scrollbar': { width: '8px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#111827', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2, height: '85vh', display: 'flex', flexDirection: 'column',
        },
      }}
    >
      {/* 헤더 */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SeverityChip severity={incident.severity} size="small" />
          <StatusChip status={incident.status} size="small" />
          <Typography variant="subtitle1" fontWeight={800} color="#fff">{incident.alarmName}</Typography>
        </Box>
        <IconButton onClick={onClose} color="inherit" size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
          
          {/* 왼쪽 정보 패널 */}
          <Box sx={{ width: '38%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#161e2e', p: 2.5 }}>
            <Box sx={{ ...scrollContainerStyle }}>
              {/* 1. 서비스 정보 */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <LanIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{incident.unitServiceName} ({incident.unitServiceId})</Typography>
                </Box>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 900, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.2 }}>
                  {incident.endpoint}
                </Typography>
              </Box>

              {/* 2. 데이터 섹션 */}
              <Box sx={{ mb: 3, p: 2, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 800, display: 'block' }}>측정된 값</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h4" fontWeight={900} color={isResolved ? 'text.secondary' : isCritical ? '#FF4D4D' : 'primary.main'}>{incident.metricValue.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>{metricUnits[incident.metricType]}</Typography>
                    </Box>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 800, display: 'block' }}>검출 기준</Typography>
                    <Typography variant="subtitle1" color="text.primary" fontWeight={800}>{metricLabels[incident.metricType]} {'>'} {incident.baseline}{metricUnits[incident.metricType]}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* 3. 해결 정보 (RESOLVED) */}
              {isResolved && incident.resolution && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TaskAltIcon sx={{ color: '#10B981', fontSize: 18 }} />
                    <Typography variant="subtitle2" color="#10B981" fontWeight={900}>조치 내용 (RESOLUTION)</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#e5e7eb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {incident.resolution}
                  </Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="caption" color="text.disabled">
                      해결: {incident.resolvedBy} · {dayjs(incident.resolvedAt).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* 4. 시간 정보 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <AccessTimeIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">최초 감지: <Typography component="span" variant="body2" fontWeight={700} color="#fff">{dayjs(incident.occurredAt).format('YYYY-MM-DD HH:mm:ss')}</Typography></Typography>
              </Box>
            </Box>

            {/* 5. 액션 버튼 (고정) */}
            {!isResolved && (
              <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {isOpen && <Button fullWidth variant="contained" onClick={() => ack(incident.id)} disabled={acking} sx={{ py: 1, fontWeight: 800 }}>인시던트 접수</Button>}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="outlined" color="warning" size="small" sx={{ fontWeight: 700 }}>Mute</Button>
                    <Button fullWidth variant="outlined" color="success" size="small" sx={{ fontWeight: 700 }}>Resolve</Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* 오른쪽 채팅 패널 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon sx={{ color: '#818CF8', fontSize: 20 }} />
              <Typography variant="body2" fontWeight={800}>AI Diagnostic Agent</Typography>
            </Box>
            
            <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: '#0a0e14' }}>
              {messages.map((msg) => (
                <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Box sx={{ maxWidth: '85%', px: 2, py: 1, borderRadius: 1.5, backgroundColor: msg.role === 'user' ? 'primary.main' : '#1e293b', color: '#fff', fontSize: '0.85rem' }}>
                    {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <Typography variant="body2" fontSize="inherit">{msg.content}</Typography>}
                  </Box>
                </Box>
              ))}
              {isChatting && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}><CircularProgress size={16} /><Typography variant="caption" color="text.secondary">분석 중...</Typography></Box>}
            </Box>

            {/* 추천 질문 및 입력 바 */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, overflowX: 'auto', pb: 0.5 }}>
                {['과거 발생 이력', '동일 서비스 장애', '주간 발생 추이'].map((label, i) => (
                  <Chip 
                    key={i} label={label} size="small" clickable 
                    onClick={() => handleSendMessage(label + ' 알려줘.')}
                    sx={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontSize: '0.7rem', '&:hover': { backgroundColor: 'rgba(129, 140, 248, 0.1)', color: '#818CF8' } }} 
                  />
                ))}
              </Box>
              <TextField 
                fullWidth multiline maxRows={3} placeholder="에이전트에게 질문하세요..." 
                value={chatInput} onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(chatInput); } }} 
                disabled={isChatting} size="small"
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => handleSendMessage(chatInput)} color="primary" size="small"><SendIcon fontSize="small" /></IconButton></InputAdornment> }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
