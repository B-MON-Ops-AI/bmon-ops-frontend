'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { DashboardLayout } from '@/widgets/dashboard-layout';
import { OverviewTab } from '@/widgets/overview-tab';
import { IncidentTab, type DatePreset } from '@/widgets/incident-tab';
import { CustomWallTab } from '@/widgets/custom-wall-tab';
import { useAppSelector } from '@/shared/store';

export default function DashboardPage() {
  const tab = useAppSelector((s) => s.ui.dashboardTab);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [customTo,   setCustomTo]   = useState(dayjs().format('YYYY-MM-DD'));

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}
