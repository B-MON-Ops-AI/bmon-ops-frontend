'use client';

/**
 * @file IncidentTab.tsx
 * @description 인시던트 탭 (필터 바 복구 및 더 보기 기능 통합)
 */

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';
import { IncidentWallCard, IncidentRowItem, IncidentDetailDrawer, useIncidents } from '@/features/incidents';
import type { Incident, Severity } from '@/entities/incident';
import dayjs from 'dayjs';

type SeverityFilter = Severity | 'all';
type ResolvedFilter = 'all' | 'unresolved' | 'resolved';
type SortOrder = 'newest' | 'severity';
type ViewMode = 'grid' | 'list';

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string; color: string | null }[] = [
  { value: 'all',      label: '전체',     color: null },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
  { value: 'warning',  label: 'Major',    color: '#F59E0B' },
  { value: 'info',     label: 'Minor',    color: '#3B82F6' },
];

const RESOLVED_OPTIONS: { value: ResolvedFilter; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'unresolved', label: '미해결' },
  { value: 'resolved',   label: '해결됨' },
];

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

// ── 필터용 헬퍼 컴포넌트 ──

function SeverityFilterChip({ option, selected, onClick }: any) {
  const { color } = option;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.625, borderRadius: '20px', cursor: 'pointer',
        backgroundColor: selected && color ? `${color}1a` : selected ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid', borderColor: selected ? (color ?? 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)',
        color: selected ? (color ?? 'text.primary') : 'text.disabled', transition: 'all 0.15s ease'
      }}
    >
      {color && <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, opacity: selected ? 1 : 0.5 }} />}
      <Typography variant="caption" fontWeight={selected ? 700 : 400}>{option.label}</Typography>
    </Box>
  );
}

function ResolvedSegment({ value, onChange }: any) {
  return (
    <Box sx={{ display: 'inline-flex', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1F2937', p: '3px', gap: '2px' }}>
      {RESOLVED_OPTIONS.map((opt) => (
        <Box key={opt.value} onClick={() => onChange(opt.value)} sx={{ px: 1.75, py: 0.5, borderRadius: '7px', cursor: 'pointer', backgroundColor: value === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          <Typography variant="caption" fontWeight={value === opt.value ? 700 : 400} sx={{ color: value === opt.value ? 'text.primary' : 'text.disabled' }}>{opt.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function SortSegment({ value, onChange }: any) {
  const options: { value: SortOrder; label: string }[] = [{ value: 'newest', label: '최신순' }, { value: 'severity', label: '위험도순' }];
  return (
    <Box sx={{ display: 'inline-flex', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1F2937', p: '3px', gap: '2px' }}>
      {options.map((opt) => (
        <Box key={opt.value} onClick={() => onChange(opt.value)} sx={{ px: 1.75, py: 0.5, borderRadius: '7px', cursor: 'pointer', backgroundColor: value === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          <Typography variant="caption" fontWeight={value === opt.value ? 700 : 400} sx={{ color: value === opt.value ? 'text.primary' : 'text.disabled' }}>{opt.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────

export default function IncidentTab() {
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [resolved, setResolved]     = useState<ResolvedFilter>('unresolved');
  const [sortOrder, setSortOrder]   = useState<SortOrder>('newest');
  const [viewMode, setViewMode]     = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected]     = useState<Incident | null>(null);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useIncidents({
    severity: severity === 'all' ? undefined : severity,
    status: resolved === 'resolved' ? 'resolved' : resolved === 'unresolved' ? 'open' : undefined,
    size: 10
  });

  const allIncidents = useMemo(() => data?.pages.flatMap(page => page.incidents) ?? [], [data]);

  const filteredAndSorted = useMemo(() => {
    let result = [...allIncidents];
    
    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.alarmName.toLowerCase().includes(q) || i.unitServiceName.toLowerCase().includes(q) || i.endpoint.toLowerCase().includes(q)
      );
    }

    // 정렬
    if (sortOrder === 'severity') {
      result.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf());
    } else {
      result.sort((a, b) => dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf());
    }

    return result;
  }, [allIncidents, searchQuery, sortOrder]);

  return (
    <Box sx={{ pb: 8 }}>
      {/* 1. 검색 바 */}
      <TextField
        fullWidth placeholder="검색어 입력..." size="small" value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2, bgcolor: '#1a2233', borderRadius: 1 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
      />

      {/* 2. 필터 바 (복구) */}
      <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: '#1a2233', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ width: 52, textTransform: 'uppercase', fontSize: '0.65rem' }}>심각도</Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {SEVERITY_OPTIONS.map((opt) => (
                <SeverityFilterChip key={opt.value} option={opt} selected={severity === opt.value} onClick={() => setSeverity(opt.value)} />
              ))}
            </Box>
          </Box>
          {/* 뷰 토글 */}
          <Box sx={{ display: 'inline-flex', bgcolor: '#1F2937', p: '3px', borderRadius: '10px' }}>
            <Box onClick={() => setViewMode('grid')} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '7px', bgcolor: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'grid' ? 'primary.main' : 'text.disabled' }}><GridViewIcon sx={{ fontSize: 18 }} /></Box>
            <Box onClick={() => setViewMode('list')} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '7px', bgcolor: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'list' ? 'primary.main' : 'text.disabled' }}><ViewListIcon sx={{ fontSize: 18 }} /></Box>
          </Box>
        </Box>
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ width: 52, textTransform: 'uppercase', fontSize: '0.65rem' }}>해결여부</Typography>
            <ResolvedSegment value={resolved} onChange={setResolved} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SortSegment value={sortOrder} onChange={setSortOrder} />
          </Box>
        </Box>
      </Box>

      {/* 3. 목록 영역 */}
      {isLoading ? <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box> : (
        <>
          <Grid container spacing={2}>
            {filteredAndSorted.map((incident) => (
              <Grid key={incident.id} item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} lg={viewMode === 'grid' ? 3 : 12}>
                {viewMode === 'grid' ? <IncidentWallCard incident={incident} onClick={setSelected} /> : <IncidentRowItem incident={incident} onClick={setSelected} />}
              </Grid>
            ))}
          </Grid>

          {hasNextPage && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button variant="outlined" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} startIcon={isFetchingNextPage ? <CircularProgress size={16} /> : <AddIcon />} sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}>
                {isFetchingNextPage ? '로딩 중...' : '10개 더 보기'}
              </Button>
            </Box>
          )}
        </>
      )}

      <IncidentDetailDrawer incident={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}
