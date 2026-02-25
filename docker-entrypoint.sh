#!/bin/sh
# 런타임 환경 변수를 public/runtime-env.js에 주입
cat <<EOF > /app/public/runtime-env.js
window.__runtime_config__ = {
  API_GROUP:      "${API_GROUP:-/api/v1}",
  AUTH_HOST:      "${AUTH_HOST:-http://localhost:8081}",
  DASHBOARD_HOST: "${DASHBOARD_HOST:-http://localhost:8082}",
  INCIDENT_HOST:  "${INCIDENT_HOST:-http://localhost:8083}",
  AI_HOST:        "${AI_HOST:-http://localhost:8084}",
  CHAT_HOST:      "${CHAT_HOST:-http://localhost:8085}",
  SETTINGS_HOST:  "${SETTINGS_HOST:-http://localhost:8086}",
};
EOF

exec "$@"
