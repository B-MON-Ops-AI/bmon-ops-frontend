'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { SIDEBAR_WIDTH } from './AppSidebar';

export const HEADER_HEIGHT = 48;

interface Props {
  title?: string;
  actions?: React.ReactNode;
}

export default function AppHeader({ title, actions }: Props) {
  if (!title && !actions) return null;

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        left: SIDEBAR_WIDTH,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        zIndex: 1200,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backgroundImage: 'none',
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, px: { xs: 2, sm: 3 }, gap: 1 }}>
        {title && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500, fontSize: '0.85rem' }}>
            {title}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        {actions}
      </Toolbar>
    </AppBar>
  );
}
