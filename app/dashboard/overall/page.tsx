'use client';

import { DashboardLayout } from '@/widgets/dashboard-layout';
import { OverviewTab } from '@/widgets/overview-tab';

export default function OverallPage() {
  return (
    <DashboardLayout>
      <OverviewTab />
    </DashboardLayout>
  );
}
