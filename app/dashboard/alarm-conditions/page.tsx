'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DashboardLayout from '@/widgets/dashboard-layout/ui/DashboardLayout';
import AlarmConditionsTab from '@/widgets/alarm-conditions-tab/ui/AlarmConditionsTab';

export default function AlarmConditionsPage() {
  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            알람 조건 현황
          </Typography>
          <Typography variant="caption" color="text.secondary">
            등록된 알람 조건과 최근 30일 실제 발생 건수를 확인합니다.
          </Typography>
        </Box>
        <AlarmConditionsTab />
      </Box>
    </DashboardLayout>
  );
}
