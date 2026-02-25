'use client';

/**
 * @file AppHeader.tsx
 * @description 글로벌 앱 헤더 (네비게이션, AI 챗 토글, Critical 뱃지)
 * @module widgets/dashboard-layout/ui
 */

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, toggleChatPanel } from '@/shared/store';
import { useCriticalCheck } from '@/features/incidents';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: <DashboardIcon />, label: '대시보드' },
  { href: '/settings', icon: <SettingsIcon />, label: '설정' },
];

interface Props {
  title?: string;
  actions?: React.ReactNode;
}

export default function AppHeader({ title, actions }: Props) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { data: criticalData } = useCriticalCheck();
  const criticalCount = criticalData?.criticalCount ?? 0;

  const isDashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard');

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 1200 }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* 로고 */}
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary"
          component={Link}
          href="/dashboard"
          sx={{ mr: 2, whiteSpace: 'nowrap', textDecoration: 'none', '&:hover': { opacity: 0.8 }, cursor: 'pointer' }}
        >
          Ops AI
        </Typography>

        {/* 페이지 타이틀 */}
        {title && (
          <Typography variant="subtitle1" fontWeight={500} color="text.secondary">
            {title}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {/* 추가 액션 */}
        {actions}

        {/* 네비게이션 아이콘 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {navItems.map(({ href, icon, label }) => {
            const isActive =
              href === '/dashboard' ? isDashboardActive : pathname.startsWith(href);
            return (
              <Tooltip key={href} title={label}>
                <IconButton
                  component={Link}
                  href={href}
                  size="small"
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {href === '/dashboard' && criticalCount > 0 ? (
                    <Badge badgeContent={criticalCount} color="error" max={99}>
                      {icon}
                    </Badge>
                  ) : (
                    icon
                  )}
                </IconButton>
              </Tooltip>
            );
          })}

          {/* AI 챗 */}
          <Tooltip title="AI 어시스턴트">
            <IconButton
              size="small"
              onClick={() => dispatch(toggleChatPanel())}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
