/**
 * @file uiSlice.ts
 * @description 전역 UI 상태 관리 (스낵바, 채팅 패널)
 * @module shared/store
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  chatPanelOpen: boolean;
  aiAnalysisIncidentId: string | null;
  dashboardTab: number; // 0=개요, 1=인시던트 Wall, 2=커스텀 Wall
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

const initialState: UIState = {
  chatPanelOpen: false,
  aiAnalysisIncidentId: null,
  dashboardTab: 0,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleChatPanel(state) {
      state.chatPanelOpen = !state.chatPanelOpen;
    },
    openChatPanel(state) {
      state.chatPanelOpen = true;
    },
    closeChatPanel(state) {
      state.chatPanelOpen = false;
    },
    openAIAnalysis(state, action: PayloadAction<string>) {
      state.aiAnalysisIncidentId = action.payload;
    },
    closeAIAnalysis(state) {
      state.aiAnalysisIncidentId = null;
    },
    showSnackbar(
      state,
      action: PayloadAction<{ message: string; severity?: UIState['snackbar']['severity'] }>
    ) {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity ?? 'info',
      };
    },
    hideSnackbar(state) {
      state.snackbar.open = false;
    },
    setDashboardTab(state, action: PayloadAction<number>) {
      state.dashboardTab = action.payload;
    },
  },
});

export const {
  toggleChatPanel,
  openChatPanel,
  closeChatPanel,
  openAIAnalysis,
  closeAIAnalysis,
  showSnackbar,
  hideSnackbar,
  setDashboardTab,
} = uiSlice.actions;

export default uiSlice.reducer;
