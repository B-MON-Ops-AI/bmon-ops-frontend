'use client';

import { useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ServiceStatusCard from './ServiceStatusCard';
import ServiceDetailDrawer from './ServiceDetailDrawer';
import { useServiceStatuses } from '@/features/dashboard/model/useDashboard';
import type { HealthStatus, ServiceStatus } from '@/entities/dashboard';

const HEALTH_ORDER: Record<HealthStatus, number> = {
  critical: 0, danger: 1, warning: 2, caution: 3, normal: 4,
};

interface Props {
  serviceIds?: string[];
}

export default function ServiceStatusGrid({ serviceIds }: Props) {
  const { data, isLoading } = useServiceStatuses();
  const [selected, setSelected] = useState<ServiceStatus | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const all = data?.services ?? [];
  const filtered = serviceIds ? all.filter((s) => serviceIds.includes(s.serviceId)) : all;
  const sorted = [...filtered].sort(
    (a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health],
  );

  if (sorted.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">표시할 서비스가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {sorted.map((status) => (
          <Grid key={status.serviceId} item xs={12} sm={6} md={4} lg={3}>
            <ServiceStatusCard
              status={status}
              onClick={() => setSelected(status)}
            />
          </Grid>
        ))}
      </Grid>

      <ServiceDetailDrawer
        status={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
