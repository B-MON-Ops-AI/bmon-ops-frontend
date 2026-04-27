'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import { ServiceStatusGrid, useServiceStatuses } from '@/features/dashboard';

// ── 도메인 정의 ────────────────────────────────────────────────

interface Domain {
  id: string;
  label: string;
  serviceIds: string[] | null; // null = 전체
}

const DOMAINS: Domain[] = [
  { id: 'all',       label: '전체',   serviceIds: null },
  { id: 'wireless',  label: '무선',   serviceIds: ['BG011701'] },
  { id: 'fixed',     label: '유선',   serviceIds: ['BG011706'] },
  { id: 'billing',   label: '요금',   serviceIds: ['BG008802'] },
  { id: 'crm',       label: 'CRM',    serviceIds: ['BG008702', 'BG009102', 'BG009201'] },
  { id: 'logistics', label: '물류',   serviceIds: ['BG009001'] },
];

// ── 도메인별 미해소 알람 수 계산 ─────────────────────────────

function useDomainUnresolvedCount() {
  const { data } = useServiceStatuses();
  return (domain: Domain): number => {
    if (!data) return 0;
    const services = domain.serviceIds
      ? data.services.filter((s) => domain.serviceIds!.includes(s.serviceId))
      : data.services;
    return services.reduce((sum, s) => sum + s.alarms.unresolved, 0);
  };
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function CustomWallTab() {
  const [domainIdx, setDomainIdx] = useState(0);
  const getDomainUnresolved = useDomainUnresolvedCount();
  const currentDomain = DOMAINS[domainIdx];

  return (
    <>
      {/* ── 도메인 탭 ── */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        <Tabs
          value={domainIdx}
          onChange={(_, v) => setDomainIdx(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { backgroundColor: '#6366F1', height: 2 },
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0,
              px: 2,
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'text.disabled',
              textTransform: 'none',
              '&.Mui-selected': { color: '#818CF8', fontWeight: 700 },
            },
          }}
        >
          {DOMAINS.map((domain, idx) => {
            const unresolved = getDomainUnresolved(domain);
            return (
              <Tab
                key={domain.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {domain.label}
                    {unresolved > 0 && (
                      <Chip
                        label={unresolved}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          backgroundColor: idx === domainIdx ? '#EF444422' : 'rgba(255,255,255,0.08)',
                          color: idx === domainIdx ? '#EF4444' : '#F87171',
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {/* ── 서비스 상태 그리드 ── */}
      <ServiceStatusGrid serviceIds={currentDomain.serviceIds ?? undefined} />
    </>
  );
}
