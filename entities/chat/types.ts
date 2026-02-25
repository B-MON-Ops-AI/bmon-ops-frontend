/**
 * @file types.ts
 * @description AI 채팅 관련 타입 정의
 * @module entities/chat
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface ChatQueryRequest {
  query: string;
}

export interface ChatQueryResponse {
  queryId: string;
  query: string;
  answer: {
    summary: string;
    keyMetrics?: { label: string; value: string; change: string }[];
    table?: { headers: string[]; rows: string[][] };
    evidence?: { queryCondition: string; timeRange: string; aggregation: string };
    nextActions?: string[];
  };
  createdAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  totalElements: number;
  currentPage: number;
  totalPages: number;
}
