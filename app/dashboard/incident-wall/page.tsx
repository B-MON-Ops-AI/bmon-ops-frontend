'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { DashboardLayout } from '@/widgets/dashboard-layout';
import { IncidentTab, type DatePreset } from '@/widgets/incident-tab';

export default function IncidentWallPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));

  return (
    <DashboardLayout>
      <IncidentTab
        datePreset={datePreset}
        customFrom={customFrom}
        customTo={customTo}
        onDatePresetChange={setDatePreset}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />
    </DashboardLayout>
  );
}
