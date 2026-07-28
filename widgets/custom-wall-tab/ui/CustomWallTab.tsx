"use client";

/**
 * @file CustomWallTab.tsx
 * @description 커스텀 Wall — 도메인별 실측 운영지표(bymi) 상황판
 * @module widgets/custom-wall-tab/ui
 *
 * 소스: bmonown.mo_bymi_* (알람과 무결합, 순수 운영지표)
 * 집계/연동: 부하 방지를 위해 1분 실시간 미채택 → 30분(byhr)·1일(bydy) 주기 토글
 * 도메인: 데이터가 유의미한 4개만 노출 (Order·LT·B2C CRM·유통).
 *         Order(DOMORDER) · LT(DOMLT) · B2C CRM(DOMB2CCRM) · 유통(DOMRDS)
 *         ICIS-TR(ICISTR)·B2B CRM(DOMB2BCRM)은 처리 2~24건으로 통계 불성립 → 제외.
 */

import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import dayjs from "dayjs";
import { useDomainMetrics } from "@/features/dashboard";
import type { DomainId, DomainPeriod } from "@/entities/dashboard";
import DomainMetricPanel from "./DomainMetricPanel";

const DOMAIN_TABS: { id: DomainId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "order", label: "Order" },
  { id: "b2ccrm", label: "B2C CRM" },
  { id: "rds", label: "유통" },
  { id: "lt", label: "LT" },
];

const PERIOD_LABEL: Record<DomainPeriod, { window: string; poll: string }> = {
  "30m": { window: "최근 30분 집계", poll: "30분마다 갱신" },
  "1d": { window: "최근 1일 집계", poll: "1일마다 갱신" },
};

export default function CustomWallTab() {
  const [domainIdx, setDomainIdx] = useState(0);
  const [period, setPeriod] = useState<DomainPeriod>("30m");
  const { data, isLoading } = useDomainMetrics(period);

  const currentId = DOMAIN_TABS[domainIdx].id;
  const metrics = data?.domains.find((d) => d.domainId === currentId) ?? null;
  const asOf = data?.asOf;
  const pl = PERIOD_LABEL[period];

  return (
    <>
      {/* ── 헤더 ── */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            도메인 운영지표
          </Typography>
          <Typography variant="caption" color="text.secondary">
            도메인별 실측 처리량·오류율·응답시간을 주기적으로 집계해 확인합니다.
          </Typography>
        </Box>

        {/* 집계 주기 토글 + 기준시각 */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
        >
          <ToggleButtonGroup
            value={period}
            exclusive
            size="small"
            onChange={(_, v: DomainPeriod | null) => v && setPeriod(v)}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.4,
                fontSize: "0.72rem",
                textTransform: "none",
                color: "text.disabled",
                borderColor: "rgba(255,255,255,0.12)",
                "&.Mui-selected": {
                  color: "#A5B4FC",
                  backgroundColor: "rgba(99,102,241,0.15)",
                  borderColor: "rgba(99,102,241,0.4)",
                  "&:hover": { backgroundColor: "rgba(99,102,241,0.22)" },
                },
              },
            }}
          >
            <ToggleButton value="30m">30분</ToggleButton>
            <ToggleButton value="1d">1일</ToggleButton>
          </ToggleButtonGroup>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.4,
            }}
          >
            <Chip
              icon={
                <ScheduleIcon
                  sx={{
                    fontSize: "13px !important",
                    color: "#818CF8 !important",
                  }}
                />
              }
              label={
                pl.window +
                (asOf ? ` · ${dayjs(asOf).format("MM/DD HH:mm")} 기준` : "")
              }
              size="small"
              sx={{
                height: 22,
                fontSize: "0.66rem",
                fontWeight: 600,
                backgroundColor: "rgba(99,102,241,0.12)",
                color: "#A5B4FC",
                border: "1px solid rgba(99,102,241,0.25)",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                color: "text.disabled",
              }}
            >
              <AutorenewIcon sx={{ fontSize: 12 }} />
              <Typography sx={{ fontSize: "0.62rem" }}>{pl.poll}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── 도메인 탭 ── */}
      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", mb: 3 }}>
        <Tabs
          value={domainIdx}
          onChange={(_, v) => setDomainIdx(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            "& .MuiTabs-indicator": { backgroundColor: "#6366F1", height: 2 },
            "& .MuiTab-root": {
              minHeight: 40,
              py: 0,
              px: 2,
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "text.disabled",
              textTransform: "none",
              "&.Mui-selected": { color: "#818CF8", fontWeight: 700 },
            },
          }}
        >
          {DOMAIN_TABS.map((d) => (
            <Tab key={d.id} label={d.label} />
          ))}
        </Tabs>
      </Box>

      {/* ── 지표 패널 ── */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : metrics ? (
        <DomainMetricPanel metrics={metrics} />
      ) : (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            표시할 지표가 없습니다.
          </Typography>
        </Box>
      )}
    </>
  );
}
