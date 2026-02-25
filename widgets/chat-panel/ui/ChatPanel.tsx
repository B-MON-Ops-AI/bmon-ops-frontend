'use client';

/**
 * @file ChatPanel.tsx
 * @description AI 어시스턴트 채팅 사이드 패널
 * @module widgets/chat-panel/ui
 */

import { useState, useRef, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector, closeChatPanel } from '@/shared/store';
import { useSendChat, useChatHistory } from '@/features/chat';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const DRAWER_WIDTH = 420;

export default function ChatPanel() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.chatPanelOpen);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const initialized = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: historyData } = useChatHistory(0, 20);
  const { mutate: sendChat, isPending } = useSendChat();

  useEffect(() => {
    if (historyData?.messages && !initialized.current) {
      initialized.current = true;
      const msgs: LocalMessage[] = historyData.messages
        .slice()
        .reverse()
        .map((m) => ({
          id: m.id,
          role: m.type === 'ai' ? 'assistant' : 'user',
          content: m.content,
          createdAt: m.createdAt,
        }));
      setLocalMessages(msgs);
    }
  }, [historyData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    const query = input.trim();
    setInput('');

    setLocalMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: query, createdAt: new Date().toISOString() },
    ]);

    sendChat(
      { query },
      {
        onSuccess: (data) => {
          setLocalMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: data.answer.summary,
              createdAt: new Date().toISOString(),
            },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => dispatch(closeChatPanel())}
      variant="persistent"
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          backgroundColor: '#1F2937',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          AI 어시스턴트
        </Typography>
        <IconButton size="small" onClick={() => dispatch(closeChatPanel())}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {localMessages.length === 0 && (
          <Typography variant="body2" color="text.disabled" textAlign="center" mt={4}>
            인프라 상태나 인시던트에 대해 질문하세요.
          </Typography>
        )}
        {localMessages.map((msg) => (
          <Box
            key={msg.id}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <Box
              sx={{
                maxWidth: '85%',
                px: 2,
                py: 1.5,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: msg.role === 'user' ? 'primary.main' : '#374151',
                color: 'text.primary',
                fontSize: '0.875rem',
                '& p': { m: 0 },
                '& pre': { overflow: 'auto', fontSize: '0.8rem' },
                '& ul, & ol': { pl: 2, my: 0.5 },
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <Typography variant="body2">{msg.content}</Typography>
              )}
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, px: 1 }}>
              {dayjs(msg.createdAt).format('HH:mm')}
            </Typography>
          </Box>
        ))}
        {isPending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">분석 중...</Typography>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="메시지를 입력하세요... (Enter로 전송)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSend} disabled={!input.trim() || isPending} color="primary">
                  <SendIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Drawer>
  );
}
