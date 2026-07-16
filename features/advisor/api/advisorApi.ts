import { aiClient } from '@/shared/api';
import type { SuggestionsResponse } from '../model/types';

export const advisorApi = {
  getSuggestions: () =>
    aiClient().get<SuggestionsResponse>('/advisor/suggestions').then((r) => r.data),

  analyze: () =>
    aiClient().post<{ success: boolean; pendingCount: number; message: string }>('/advisor/analyze').then((r) => r.data),

  approve: (alarmId: string) =>
    aiClient()
      .post<{ success: boolean; message: string; newThreshold?: number }>(`/advisor/suggestions/${alarmId}/approve`)
      .then((r) => r.data),

  reject: (alarmId: string) =>
    aiClient()
      .post<{ success: boolean; message: string }>(`/advisor/suggestions/${alarmId}/reject`)
      .then((r) => r.data),
};
