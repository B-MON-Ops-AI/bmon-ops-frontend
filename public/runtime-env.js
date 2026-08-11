// 런타임 환경 변수 (⚠️ 현재: 로컬 mock-db 테스트용 localhost:19091)
// ⚠️ 배포 전 반드시 http://10.217.136.185:19091 (dev 실 백엔드)로 원복할 것.
window.__runtime_config__ = {
  API_GROUP: "/api/v1",
  DASHBOARD_HOST: "http://localhost:19091",
  INCIDENT_HOST: "http://localhost:19091",
  AI_HOST: "http://localhost:19091",
  CHAT_HOST: "http://localhost:19091",
};
