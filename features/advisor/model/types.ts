export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface ThresholdSuggestion {
  alarm_id: string;
  alarm_name: string;
  service_id: string;
  service_name: string;
  alarm_level: string;
  detect_type: string;
  detect_term: string;
  current_threshold: number;
  suggested_threshold: number;
  auto_clear_rate: number;
  trigger_count_30d: number;
  avg_detect_value: number;
  rationale: string;
  status: SuggestionStatus;
  approved_at?: string | null;
  rejected_at?: string | null;
}

export interface SuggestionsResponse {
  suggestions: ThresholdSuggestion[];
  totalCount: number;
  pendingCount: number;
  lastAnalyzedAt: string | null;
}
