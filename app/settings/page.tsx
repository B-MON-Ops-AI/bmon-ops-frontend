'use client';

/**
 * @file page.tsx
 * @description 설정 페이지 (임계값, 알림, 사용자 관리)
 * @module app/settings
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import { DashboardLayout } from '@/widgets/dashboard-layout';
import { BackButton } from '@/shared/ui';
import { ThresholdTab, NotificationTab, UsersTab } from '@/features/settings';

const TABS = [
  { label: '임계값', icon: <TuneIcon fontSize="small" /> },
  { label: '알림', icon: <NotificationsIcon fontSize="small" /> },
  { label: '사용자', icon: <PeopleIcon fontSize="small" /> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  const headerActions = (
    <Box sx={{ mr: 1 }}>
      <BackButton />
    </Box>
  );

  return (
    <DashboardLayout title="설정" headerActions={headerActions}>
      <Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          {TABS.map((t, i) => (
            <Tab
              key={i}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>

        {tab === 0 && <ThresholdTab />}
        {tab === 1 && <NotificationTab />}
        {tab === 2 && <UsersTab />}
      </Box>
    </DashboardLayout>
  );
}
