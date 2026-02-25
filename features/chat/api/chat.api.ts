/**
 * @file chat.api.ts
 * @description AI 채팅 API 클라이언트 (질의, 이력 조회)
 * @module features/chat/api
 */
import { chatClient } from '@/shared/api';
import type { ChatQueryRequest, ChatQueryResponse, ChatHistoryResponse } from '@/entities/chat';

export const chatApi = {
  query: (data: ChatQueryRequest) =>
    chatClient().post<ChatQueryResponse>('/chat/query', data).then((r) => r.data),

  getHistory: (page = 0, size = 20) =>
    chatClient()
      .get<ChatHistoryResponse>('/chat/history', { params: { page, size, sort: 'createdAt,desc' } })
      .then((r) => r.data),
};
