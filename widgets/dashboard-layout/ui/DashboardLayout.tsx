'use client';

import Box from '@mui/material/Box';
import AppHeader, { HEADER_HEIGHT } from '@/widgets/dashboard-layout/ui/AppHeader';
import AppSidebar, { SIDEBAR_WIDTH } from '@/widgets/dashboard-layout/ui/AppSidebar';
import GlobalSnackbar from '@/widgets/dashboard-layout/ui/GlobalSnackbar';
import { ChatPanel } from '@/widgets/chat-panel';

interface Props {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
}

export const CHAT_PANEL_WIDTH = 420;

export default function DashboardLayout({ children, title, headerActions }: Props) {
  const hasHeader = Boolean(title || headerActions);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppSidebar />

      <Box
        component="main"
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          mt: hasHeader ? `${HEADER_HEIGHT}px` : 0,
          flex: 1,
          minWidth: 0,
          p: 3,
        }}
      >
        <AppHeader title={title} actions={headerActions} />
        {children}
      </Box>

      <ChatPanel />
      <GlobalSnackbar />
    </Box>
  );
}
