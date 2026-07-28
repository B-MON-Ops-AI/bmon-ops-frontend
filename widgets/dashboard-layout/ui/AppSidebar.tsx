"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import GridViewIcon from "@mui/icons-material/GridView";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, toggleChatPanel } from "@/shared/store";
import { useCriticalCheck } from "@/features/incidents";

export const SIDEBAR_WIDTH = 200;

const navItemSx = (active: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  px: 1.5,
  py: 1.25,
  mx: 0.75,
  borderRadius: "6px",
  textDecoration: "none",
  color: active ? "#A5B4FC" : "rgba(255,255,255,0.5)",
  backgroundColor: active ? "rgba(99,102,241,0.14)" : "transparent",
  fontSize: "0.9rem",
  fontWeight: active ? 600 : 400,
  transition: "background-color 0.12s, color 0.12s",
  cursor: "pointer",
  userSelect: "none" as const,
  "&:hover": {
    backgroundColor: active
      ? "rgba(99,102,241,0.18)"
      : "rgba(255,255,255,0.05)",
    color: active ? "#A5B4FC" : "rgba(255,255,255,0.8)",
  },
});

const SectionLabel = ({ label }: { label: string }) => (
  <Typography
    sx={{
      fontSize: "0.6rem",
      fontWeight: 700,
      color: "rgba(255,255,255,0.25)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      px: 2.25,
      pt: 1.5,
      pb: 0.5,
    }}
  >
    {label}
  </Typography>
);

export default function AppSidebar() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { data: criticalData } = useCriticalCheck();
  const criticalCount = criticalData?.criticalCount ?? 0;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: SIDEBAR_WIDTH,
        height: "100vh",
        backgroundColor: "background.paper",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1300,
      }}
    >
      {/* 로고 */}
      <Box
        component={Link}
        href="/dashboard/overall"
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1.75,
          textDecoration: "none",
          "&:hover": { opacity: 0.8 },
        }}
      >
        <Typography
          fontWeight={800}
          sx={{ color: "#A5B4FC", fontSize: "0.82rem", letterSpacing: "-0.01em" }}
        >
          BMON AI Agent
        </Typography>
      </Box>

      <Box sx={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", mx: 1.5, mb: 1 }} />

      {/* 네비게이션 */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>

        {/* 대시보드 */}
        <SectionLabel label="대시보드" />

        <Box
          component={Link}
          href="/dashboard/overall"
          sx={navItemSx(pathname === "/dashboard/overall")}
        >
          <GridViewIcon sx={{ fontSize: 15 }} />
          <span>Overall</span>
        </Box>

        <Box
          component={Link}
          href="/dashboard/incident-wall"
          sx={navItemSx(pathname === "/dashboard/incident-wall")}
        >
          <Badge
            badgeContent={criticalCount}
            color="error"
            max={99}
            sx={{ "& .MuiBadge-badge": { fontSize: "0.5rem", minWidth: 13, height: 13, padding: "0 3px" } }}
          >
            <WarningAmberIcon sx={{ fontSize: 15 }} />
          </Badge>
          <span>인시던트 Wall</span>
        </Box>

        <Box
          component={Link}
          href="/dashboard/custom-wall"
          sx={navItemSx(pathname === "/dashboard/custom-wall")}
        >
          <DashboardCustomizeIcon sx={{ fontSize: 15 }} />
          <span>커스텀 Wall</span>
        </Box>

        <Box sx={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", mx: 1.5, my: 1 }} />

        {/* 관리 */}
        <SectionLabel label="관리" />

        <Box
          component={Link}
          href="/dashboard/alarm-conditions"
          sx={navItemSx(pathname === "/dashboard/alarm-conditions")}
        >
          <NotificationsNoneIcon sx={{ fontSize: 15 }} />
          <span>알람 조건</span>
        </Box>

        <Box
          component={Link}
          href="/dashboard/shadow-test"
          sx={navItemSx(pathname === "/dashboard/shadow-test")}
        >
          <ScienceOutlinedIcon sx={{ fontSize: 15 }} />
          <span>Shadow Test</span>
        </Box>

        <Box sx={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", mx: 1.5, my: 1 }} />

        {/* 도구 */}
        <SectionLabel label="도구" />

        <Box onClick={() => dispatch(toggleChatPanel())} sx={navItemSx(false)}>
          <ChatBubbleIcon sx={{ fontSize: 15 }} />
          <span>AI 어시스턴트</span>
        </Box>

      </Box>
    </Box>
  );
}
