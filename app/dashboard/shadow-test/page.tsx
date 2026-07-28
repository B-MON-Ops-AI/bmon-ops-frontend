'use client';

import DashboardLayout from '@/widgets/dashboard-layout/ui/DashboardLayout';
import { ShadowTestTab } from '@/widgets/shadow-test-tab';

export default function ShadowTestPage() {
  return (
    <DashboardLayout>
      <ShadowTestTab />
    </DashboardLayout>
  );
}
