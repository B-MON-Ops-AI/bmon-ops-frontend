/**
 * @file data.ts
 * @description Mock 모드용 더미 데이터 정의
 * @module shared/api/mock
 */
// ── Dashboard ────────────────────────────────────────────

function makeChart(base: number, len = 20): { time: string; value: number }[] {
  const now = Date.now();
  return Array.from({ length: len }, (_, i) => ({
    time: new Date(now - (len - i) * 60_000).toISOString(),
    value: Math.max(0, base + Math.round((Math.random() - 0.5) * base * 0.4)),
  }));
}

export const MOCK_WIDGETS = {
  widgets: [
    { id: 'w1', serviceId: 'payment-service', serviceName: '결제 서비스', metricType: 'error_rate', order: 0 },
    { id: 'w2', serviceId: 'order-service', serviceName: '주문 서비스', metricType: 'response_time', order: 1 },
    { id: 'w3', serviceId: 'user-service', serviceName: '사용자 서비스', metricType: 'traffic', order: 2 },
    { id: 'w4', serviceId: 'inventory-service', serviceName: '재고 서비스', metricType: 'request_count', order: 3 },
    { id: 'w5', serviceId: 'notification-service', serviceName: '알림 서비스', metricType: 'error_rate', order: 4 },
    { id: 'w6', serviceId: 'search-service', serviceName: '검색 서비스', metricType: 'response_time', order: 5 },
  ],
};

export const MOCK_METRICS: Record<string, Record<string, object>> = {
  'payment-service': {
    error_rate: { serviceId: 'payment-service', metricType: 'error_rate', value: 8.4, unit: '%', trend: 1, chartData: makeChart(8), updatedAt: new Date().toISOString() },
  },
  'order-service': {
    response_time: { serviceId: 'order-service', metricType: 'response_time', value: 342, unit: 'ms', trend: 1, chartData: makeChart(340), updatedAt: new Date().toISOString() },
  },
  'user-service': {
    traffic: { serviceId: 'user-service', metricType: 'traffic', value: 1240, unit: 'req/s', trend: -1, chartData: makeChart(1200), updatedAt: new Date().toISOString() },
  },
  'inventory-service': {
    request_count: { serviceId: 'inventory-service', metricType: 'request_count', value: 58420, unit: 'req', trend: 0, chartData: makeChart(58000), updatedAt: new Date().toISOString() },
  },
  'notification-service': {
    error_rate: { serviceId: 'notification-service', metricType: 'error_rate', value: 1.2, unit: '%', trend: -1, chartData: makeChart(1), updatedAt: new Date().toISOString() },
  },
  'search-service': {
    response_time: { serviceId: 'search-service', metricType: 'response_time', value: 95, unit: 'ms', trend: 0, chartData: makeChart(90), updatedAt: new Date().toISOString() },
  },
};

// ── Incidents ────────────────────────────────────────────

const T = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

export const MOCK_INCIDENTS = {
  incidents: [
    {
      id: 'inc-001',
      serviceId: 'payment-service',
      serviceName: '결제 서비스',
      metricType: 'error_rate',
      metricValue: 8.4,
      baseline: 1.0,
      changePercent: 740,
      severity: 'critical',
      status: 'open',
      occurredAt: T(12),
    },
    {
      id: 'inc-002',
      serviceId: 'order-service',
      serviceName: '주문 서비스',
      metricType: 'response_time',
      metricValue: 3420,
      baseline: 300,
      changePercent: 1040,
      severity: 'critical',
      status: 'acknowledged',
      occurredAt: T(35),
      ackedAt: T(28),
      ackedBy: 'operator123',
    },
    {
      id: 'inc-003',
      serviceId: 'user-service',
      serviceName: '사용자 서비스',
      metricType: 'traffic',
      metricValue: 4800,
      baseline: 1200,
      changePercent: 300,
      severity: 'warning',
      status: 'open',
      occurredAt: T(8),
    },
    {
      id: 'inc-004',
      serviceId: 'inventory-service',
      serviceName: '재고 서비스',
      metricType: 'error_rate',
      metricValue: 3.1,
      baseline: 0.5,
      changePercent: 520,
      severity: 'warning',
      status: 'muted',
      occurredAt: T(60),
      mutedUntil: new Date(Date.now() + 60 * 60_000).toISOString(),
      mutedBy: 'operator123',
    },
    {
      id: 'inc-005',
      serviceId: 'notification-service',
      serviceName: '알림 서비스',
      metricType: 'response_time',
      metricValue: 1800,
      baseline: 200,
      changePercent: 800,
      severity: 'warning',
      status: 'open',
      occurredAt: T(5),
    },
    {
      id: 'inc-006',
      serviceId: 'search-service',
      serviceName: '검색 서비스',
      metricType: 'request_count',
      metricValue: 12000,
      baseline: 5000,
      changePercent: 140,
      severity: 'info',
      status: 'resolved',
      occurredAt: T(120),
      resolvedAt: T(90),
      resolvedBy: 'operator123',
      resolution: '트래픽 급증으로 인한 일시적 증가. 스케일아웃 후 정상화.',
    },
  ],
  totalElements: 6,
  totalPages: 1,
  currentPage: 0,
};

export const MOCK_CRITICAL_CHECK = {
  hasCritical: true,
  criticalCount: 2,
  latestOccurredAt: T(5),
};

// ── AI Analysis ──────────────────────────────────────────

export const MOCK_AI_ANALYSIS: Record<string, object> = {
  'inc-001': {
    incidentId: 'inc-001',
    status: 'completed',
    progress: 100,
    result: {
      whatChanged: [
        '에러율이 기준치 1.0%에서 8.4%로 급등 (740% 증가)',
        '결제 API 응답 코드 중 5xx 비율이 전체의 42%를 차지',
        'DB 커넥션 풀 사용률 95% 도달',
      ],
      whyHappened: [
        { cause: 'DB 커넥션 풀 고갈로 인한 타임아웃 발생', confidence: 0.87 },
        { cause: '대규모 배치 잡이 DB 리소스를 독점 점유', confidence: 0.71 },
        { cause: '특정 결제 플로우의 N+1 쿼리 패턴', confidence: 0.54 },
      ],
      similarCases: [
        {
          date: '2025-11-14',
          description: '블랙프라이데이 트래픽 급증으로 유사한 DB 커넥션 고갈 발생',
          resolution: '커넥션 풀 크기를 50→200으로 증가, 배치 잡 스케줄 분산',
        },
        {
          date: '2025-09-03',
          description: '야간 배치 작업 중 결제 서비스 에러율 6.2% 도달',
          resolution: '배치 잡 실행 시간대를 트래픽 최저치 구간으로 변경',
        },
      ],
      recommendedActions: [
        'DB 커넥션 풀 크기를 현재 50에서 150으로 즉시 증가',
        '실행 중인 배치 잡 일시 중단 또는 리소스 제한 설정',
        '결제 서비스 인스턴스 수평 스케일아웃 (현재 3→6개)',
        '슬로우 쿼리 로그 분석 후 N+1 쿼리 최적화 계획 수립',
      ],
    },
  },
  'inc-002': {
    incidentId: 'inc-002',
    status: 'completed',
    progress: 100,
    result: {
      whatChanged: [
        '주문 서비스 P99 응답시간 300ms → 3420ms로 증가',
        '외부 배송사 API 호출 타임아웃 비율 68% 증가',
      ],
      whyHappened: [
        { cause: '외부 배송사 API 서버 장애로 인한 응답 지연', confidence: 0.92 },
        { cause: 'Circuit Breaker 미설정으로 타임아웃 전파', confidence: 0.78 },
      ],
      similarCases: [],
      recommendedActions: [
        '배송사 API 호출에 Circuit Breaker 패턴 적용 (Resilience4j)',
        '배송사 API 타임아웃을 5초에서 2초로 단축',
        '배송 서비스 장애 시 fallback 응답 처리 로직 추가',
      ],
    },
  },
};

// ── Chat History ─────────────────────────────────────────

export const MOCK_CHAT_HISTORY = {
  messages: [
    {
      id: 'msg-1',
      type: 'user',
      content: '현재 가장 심각한 인시던트는 무엇인가요?',
      createdAt: T(30),
    },
    {
      id: 'msg-2',
      type: 'ai',
      content: '현재 **Critical** 등급 인시던트 2건이 발생 중입니다.\n\n1. **결제 서비스** - 에러율 8.4% (기준치 대비 740% 초과, 12분 전 발생)\n2. **주문 서비스** - 응답시간 3420ms (기준치 대비 1040% 초과, 35분 전 발생)\n\n결제 서비스는 DB 커넥션 풀 고갈이 원인으로 분석되며, 즉각적인 조치가 필요합니다.',
      createdAt: T(29),
    },
  ],
  totalElements: 2,
  currentPage: 0,
  totalPages: 1,
};

// ── Settings ─────────────────────────────────────────────

export const MOCK_THRESHOLDS = {
  thresholds: [
    { serviceId: 'payment-service', serviceName: '결제 서비스', errorRate: 2.0, responseTime: 500, traffic: 3000 },
    { serviceId: 'order-service', serviceName: '주문 서비스', errorRate: 1.5, responseTime: 800, traffic: 2000 },
    { serviceId: 'user-service', serviceName: '사용자 서비스', errorRate: 1.0, responseTime: 300, traffic: 5000 },
    { serviceId: 'inventory-service', serviceName: '재고 서비스', errorRate: 1.0, responseTime: 400, traffic: 1000 },
    { serviceId: 'notification-service', serviceName: '알림 서비스', errorRate: 0.5, responseTime: 200, traffic: 800 },
    { serviceId: 'search-service', serviceName: '검색 서비스', errorRate: 0.5, responseTime: 150, traffic: 10000 },
  ],
};

export const MOCK_NOTIFICATIONS = {
  slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/mock-token',
  receivers: {
    critical: ['@ops-team', 'admin@company.com'],
    warning: ['@dev-team'],
    info: [],
  },
};

export const MOCK_USERS = {
  users: [
    { id: 'operator123', name: '운영자', email: 'operator@company.com', role: 'OPERATOR', isActive: true, createdAt: '2025-01-15T09:00:00Z' },
    { id: 'admin001', name: '관리자', email: 'admin@company.com', role: 'ADMIN', isActive: true, createdAt: '2025-01-01T09:00:00Z' },
    { id: 'viewer001', name: '조회자', email: 'viewer@company.com', role: 'VIEWER', isActive: true, createdAt: '2025-02-01T09:00:00Z' },
    { id: 'dev001', name: '개발자', email: 'dev@company.com', role: 'OPERATOR', isActive: false, createdAt: '2025-01-20T09:00:00Z' },
  ],
  totalElements: 4,
  totalPages: 1,
  currentPage: 0,
};
