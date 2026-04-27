'use client';

import { DashboardLayout } from '@/widgets/dashboard-layout';
import { CustomWallTab } from '@/widgets/custom-wall-tab';

export default function CustomWallPage() {
  return (
    <DashboardLayout>
      <CustomWallTab />
    </DashboardLayout>
  );
}
