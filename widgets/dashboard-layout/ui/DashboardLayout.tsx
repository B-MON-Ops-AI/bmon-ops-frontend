'use client';

/**
 * @file DashboardLayout.tsx
 * @description 대시보드 공통 레이아웃 (헤더, 메인 영역, 채팅 패널, 스낵바)
 * @module widgets/dashboard-layout/ui
 */

import Box from '@mui/material/Box';
import { useAppSelector } from '@/shared/store';
import AppHeader from '@/widgets/dashboard-layout/ui/AppHeader';
import GlobalSnackbar from '@/widgets/dashboard-layout/ui/GlobalSnackbar';
import { ChatPanel } from '@/widgets/chat-panel';

interface Props {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
}

const CHAT_PANEL_WIDTH = 420;

export default function DashboardLayout({ children, title, headerActions }: Props) {
  const chatOpen = useAppSelector((s) => s.ui.chatPanelOpen);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppHeader title={title} actions={headerActions} />

      <Box
        component="main"
        sx={{
          mt: '64px',
          flex: 1,
          p: 3,
          mr: chatOpen ? `${CHAT_PANEL_WIDTH}px` : 0,
          transition: 'margin-right 0.3s ease',
        }}
      >
        {children}
      </Box>

      <ChatPanel />
      <GlobalSnackbar />
    </Box>
  );
}
