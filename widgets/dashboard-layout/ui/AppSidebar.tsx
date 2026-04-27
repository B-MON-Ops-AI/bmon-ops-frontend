"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GridViewIcon from "@mui/icons-material/GridView";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, toggleChatPanel } from "@/shared/store";
import { useCriticalCheck } from "@/features/incidents";

export const SIDEBAR_WIDTH = 200;

const dashTabs = [
  { href: "/dashboard/overall", icon: <GridViewIcon sx={{ fontSize: 13 }} />, label: "OverAll" },
  { href: "/dashboard/incident-wall", icon: <WarningAmberIcon sx={{ fontSize: 13 }} />, label: "인시던트 Wall" },
  { href: "/dashboard/custom-wall", icon: <DashboardCustomizeIcon sx={{ fontSize: 13 }} />, label: "커스텀 Wall" },
];

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

export default function AppSidebar() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { data: criticalData } = useCriticalCheck();
  const criticalCount = criticalData?.criticalCount ?? 0;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAlarmConditions = pathname === "/dashboard/alarm-conditions";

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
          sx={{
            color: "#A5B4FC",
            fontSize: "0.95rem",
            letterSpacing: "-0.01em",
          }}
        >
          Ops AI
        </Typography>
      </Box>

      <Box
        sx={{
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.07)",
          mx: 1.5,
          mb: 1,
        }}
      />

      {/* 네비게이션 */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>
        {/* 대시보드 */}
        <Box
          component={Link}
          href="/dashboard/overall"
          sx={navItemSx(isDashboard && !isAlarmConditions)}
        >
          <Badge
            badgeContent={criticalCount}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.5rem",
                minWidth: 13,
                height: 13,
                padding: "0 3px",
              },
            }}
          >
            <DashboardIcon sx={{ fontSize: 15 }} />
          </Badge>
          <span>대시보드</span>
        </Box>

        {/* 대시보드 서브탭 */}
        {isDashboard && !isAlarmConditions && (
          <Box sx={{ mt: 0.25, mb: 0.5 }}>
            {dashTabs.map((t) => {
              const sel = pathname === t.href;
              const showBadge = t.href === "/dashboard/incident-wall" && criticalCount > 0;
              return (
                <Box
                  key={t.href}
                  component={Link}
                  href={t.href}
                  sx={{
                    ...navItemSx(sel),
                    pl: 3.5,
                    py: 0.875,
                    fontSize: "0.85rem",
                  }}
                >
                  {showBadge ? (
                    <Badge
                      badgeContent={criticalCount}
                      color="error"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.5rem",
                          minWidth: 13,
                          height: 13,
                          padding: "0 3px",
                          top: -2,
                          right: -2,
                        },
                      }}
                    >
                      {t.icon}
                    </Badge>
                  ) : (
                    t.icon
                  )}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "inherit",
                      fontWeight: "inherit",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {/* 알람 조건 현황 */}
        <Box
          component={Link}
          href="/dashboard/alarm-conditions"
          sx={navItemSx(isAlarmConditions)}
        >
          <NotificationsNoneIcon sx={{ fontSize: 15 }} />
          <span>알람 조건</span>
        </Box>

        {/* AI 어시스턴트 */}
        <Box onClick={() => dispatch(toggleChatPanel())} sx={navItemSx(false)}>
          <ChatBubbleIcon sx={{ fontSize: 15 }} />
          <span>AI 어시스턴트</span>
        </Box>

      </Box>
    </Box>
  );
}
