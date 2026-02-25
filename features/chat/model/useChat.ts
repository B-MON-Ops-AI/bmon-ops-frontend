/**
 * @file useChat.ts
 * @description AI 채팅 메시지 송수신 커스텀 훅
 * @module features/chat/model
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/features/chat/api/chat.api';
import type { ChatQueryRequest } from '@/entities/chat';

export function useChatHistory(page = 0, size = 20) {
  return useQuery({
    queryKey: ['chat-history', page, size],
    queryFn: () => chatApi.getHistory(page, size),
  });
}

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChatQueryRequest) => chatApi.query(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-history'] }),
  });
}
