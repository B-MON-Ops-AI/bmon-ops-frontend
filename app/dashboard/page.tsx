'use client';

/**
 * @file page.tsx
 * @description 대시보드 메인 페이지 (개요 / 인시던트 Wall / 커스텀 Wall)
 * @module app/dashboard
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import GridViewIcon from '@mui/icons-material/GridView';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import dayjs from 'dayjs';
import { DashboardLayout } from '@/widgets/dashboard-layout';
import { OverviewTab } from '@/widgets/overview-tab';
import { IncidentTab, type DatePreset, getDateRange } from '@/widgets/incident-tab';
import { CustomWallTab } from '@/widgets/custom-wall-tab';
import { useCriticalCheck } from '@/features/incidents';

export default function DashboardPage() {
  const [tab, setTab] = useState(0);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [customTo, setCustomTo]     = useState(dayjs().format('YYYY-MM-DD'));

  const { from_date } = getDateRange(datePreset, customFrom, customTo);
  const { data: criticalData } = useCriticalCheck(from_date);
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
            icon={<GridViewIcon fontSize="small" />}
            iconPosition="start"
            label="개요"
          />
          <Tab
            icon={
              <Badge badgeContent={criticalCount > 0 ? criticalCount : undefined} color="error" max={99}>
                <WarningAmberIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="인시던트 Wall"
          />
          <Tab
            icon={<DashboardCustomizeIcon fontSize="small" />}
            iconPosition="start"
            label="커스텀 Wall"
          />
        </Tabs>

        {tab === 0 && <OverviewTab />}
        {tab === 1 && (
          <IncidentTab
            datePreset={datePreset}
            customFrom={customFrom}
            customTo={customTo}
            onDatePresetChange={setDatePreset}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
        )}
        {tab === 2 && <CustomWallTab />}
      </Box>
    </DashboardLayout>
  );
}
