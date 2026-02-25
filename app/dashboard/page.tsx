'use client';

/**
 * @file page.tsx
 * @description 대시보드 메인 페이지 (인시던트 탭, 커스텀 월 탭)
 * @module app/dashboard
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import { DashboardLayout } from '@/widgets/dashboard-layout';
import { IncidentTab } from '@/widgets/incident-tab';
import { CustomWallTab } from '@/widgets/custom-wall-tab';
import { useCriticalCheck } from '@/features/incidents';

export default function DashboardPage() {
  const [tab, setTab] = useState(0);
  const { data: criticalData } = useCriticalCheck();
  const criticalCount = criticalData?.criticalCount ?? 0;

  return (
    <DashboardLayout>
      <Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 52, fontWeight: 600 },
          }}
        >
          <Tab
            icon={
              <Badge badgeContent={criticalCount > 0 ? criticalCount : undefined} color="error" max={99}>
                <WarningAmberIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="인시던트"
          />
          <Tab
            icon={<DashboardCustomizeIcon fontSize="small" />}
            iconPosition="start"
            label="커스텀 Wall"
          />
        </Tabs>

        {tab === 0 && <IncidentTab />}
        {tab === 1 && <CustomWallTab />}
      </Box>
    </DashboardLayout>
  );
}
