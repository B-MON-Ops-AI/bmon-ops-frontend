// 런타임 환경 변수 (dev 배포 — 실 백엔드 10.217.136.185:19091)
// ⚠️ 로컬 mock-db 테스트 시에만 http://localhost:19091 로 임시 전환 후, 배포 전 반드시 원복.
window.__runtime_config__ = {
  API_GROUP: "/api/v1",
  DASHBOARD_HOST: "http://10.217.136.185:19091",
  INCIDENT_HOST: "http://10.217.136.185:19091",
  AI_HOST: "http://10.217.136.185:19091",
  CHAT_HOST: "http://10.217.136.185:19091",
};
