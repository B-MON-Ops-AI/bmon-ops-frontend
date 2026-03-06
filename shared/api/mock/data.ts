/**
 * @file data.ts
 * @description Mock 데이터 (해결 정보 필드 보강)
 */

const T = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const MOCK_INCIDENTS = {
  incidents: [
    // ... (앞부분 생략, inc-006 부분만 수정하여 전체 쓰기)
    {
      id: 'inc-001',
      unitServiceId: 'KOS-MOB-01',
      unitServiceName: 'KOS-모바일 계약',
      alarmName: 'KOS 무선오더 모바일 상품저장처리 시스템 오류 다량 발생',
      endpoint: '/api/v1/contract/mobile/save',
      metricType: 'error_rate',
      metricValue: 8.4,
      baseline: 1.0,
      changePercent: 740,
      severity: 'critical',
      status: 'open',
      occurredAt: T(5),
    },
    {
      id: 'inc-002',
      unitServiceId: 'KOS-ORD-02',
      unitServiceName: 'KOS-주문 관리',
      alarmName: 'KOS 주문 처리 대기 큐 임계치 초과 지연 발생',
      endpoint: '/api/v2/order/processing',
      metricType: 'response_time',
      metricValue: 3420,
      baseline: 300,
      changePercent: 1040,
      severity: 'critical',
      status: 'acknowledged',
      occurredAt: T(15),
    },
    {
      id: 'inc-006',
      unitServiceId: 'KOS-SRCH-01',
      unitServiceName: 'KOS-상품 검색',
      alarmName: '상품 인덱싱 요청 처리량 급증 (과부하 주의)',
      endpoint: '/search/v3/rebuild',
      metricType: 'request_count',
      metricValue: 15000,
      baseline: 5000,
      changePercent: 200,
      severity: 'info',
      status: 'resolved',
      occurredAt: T(120),
      // 해결 정보 추가
      resolution: '검색 엔진 인덱싱 요청이 일시적으로 몰려 발생한 현상입니다. 인덱서 인스턴스를 2대에서 4대로 스케일 아웃하여 처리를 완료하였으며, 현재 지연 없이 정상 작동 중입니다.',
      resolvedBy: '홍길동 과장',
      resolvedAt: T(90),
    },
    // ... (나머지 데이터 유지)
    { id: 'inc-003', unitServiceId: 'KOS-AUTH-01', unitServiceName: 'KOS-사용자 인증', alarmName: 'SSO 통합 로그인 세션 검증 오류 증가', endpoint: '/auth/sso/verify', metricType: 'error_rate', metricValue: 4.2, baseline: 0.1, changePercent: 4100, severity: 'critical', status: 'open', occurredAt: T(2) },
    { id: 'inc-004', unitServiceId: 'KOS-INV-01', unitServiceName: 'KOS-재고 연동', alarmName: '실시간 재고 동기화 API 타임아웃 발생', endpoint: '/external/inventory/sync', metricType: 'response_time', metricValue: 1250, baseline: 200, changePercent: 525, severity: 'warning', status: 'open', occurredAt: T(30) },
    { id: 'inc-005', unitServiceId: 'KOS-PAY-03', unitServiceName: 'KOS-결제 처리', alarmName: '카드사 승인 응답 지연으로 인한 결제 실패 건수 증가', endpoint: '/api/v1/payment/approve', metricType: 'error_rate', metricValue: 2.8, baseline: 0.5, changePercent: 460, severity: 'warning', status: 'open', occurredAt: T(45) },
    { id: 'inc-007', unitServiceId: 'KOS-NOTI-01', unitServiceName: 'KOS-푸시 알림', alarmName: 'FCM 푸시 발송 실패율 소폭 상승', endpoint: '/push/send/fcm', metricType: 'error_rate', metricValue: 1.5, baseline: 0.2, changePercent: 650, severity: 'warning', status: 'open', occurredAt: T(10) },
    { id: 'inc-008', unitServiceId: 'KOS-DELI-02', unitServiceName: 'KOS-배송 추적', alarmName: '택배사 연동 API 응답 지연 감지', endpoint: '/api/v1/delivery/track', metricType: 'response_time', metricValue: 850, baseline: 150, changePercent: 466, severity: 'info', status: 'open', occurredAt: T(60) },
    { id: 'inc-009', unitServiceId: 'KOS-USER-05', unitServiceName: 'KOS-마이페이지', alarmName: '포인트 조회 API 간헐적 500 에러 발생', endpoint: '/api/v1/user/point', metricType: 'error_rate', metricValue: 3.2, baseline: 0.1, changePercent: 3100, severity: 'critical', status: 'open', occurredAt: T(8) },
    { id: 'inc-010', unitServiceId: 'KOS-CART-01', unitServiceName: 'KOS-장바구니', alarmName: '장바구니 담기 요청량 비정상 급증', endpoint: '/api/v1/cart/add', metricType: 'request_count', metricValue: 8500, baseline: 1200, changePercent: 608, severity: 'warning', status: 'open', occurredAt: T(22) },
    { id: 'inc-011', unitServiceId: 'KOS-COUP-01', unitServiceName: 'KOS-쿠폰 시스템', alarmName: '쿠폰 적용 API 응답 시간 임계치 근접', endpoint: '/api/v1/coupon/apply', metricType: 'response_time', metricValue: 450, baseline: 100, changePercent: 350, severity: 'info', status: 'open', occurredAt: T(55) },
    { id: 'inc-012', unitServiceId: 'KOS-SETT-01', unitServiceName: 'KOS-정산 서비스', alarmName: '일일 정산 배치 작업 지연 발생', endpoint: '/batch/settlement/daily', metricType: 'response_time', metricValue: 5400, baseline: 1200, changePercent: 350, severity: 'warning', status: 'open', occurredAt: T(180) },
    { id: 'inc-013', unitServiceId: 'KOS-CS-01', unitServiceName: 'KOS-상담 시스템', alarmName: '상담 로그 저장 데이터베이스 부하 발생', endpoint: '/api/v1/cs/log', metricType: 'error_rate', metricValue: 1.2, baseline: 0.05, changePercent: 2300, severity: 'critical', status: 'open', occurredAt: T(1) },
    { id: 'inc-014', unitServiceId: 'KOS-STAT-01', unitServiceName: 'KOS-통계 분석', alarmName: '대시보드 메트릭 수집 누락 감지', endpoint: '/metrics/collect', metricType: 'error_rate', metricValue: 0.8, baseline: 0.01, changePercent: 7900, severity: 'warning', status: 'open', occurredAt: T(12) },
    { id: 'inc-015', unitServiceId: 'KOS-FILE-01', unitServiceName: 'KOS-파일 서버', alarmName: '이미지 업로드 API 트래픽 초과', endpoint: '/api/v1/upload/image', metricType: 'traffic', metricValue: 500, baseline: 100, changePercent: 400, severity: 'info', status: 'open', occurredAt: T(3) },
  ],
};

export const MOCK_WIDGETS = [
  { id: 'w1', title: '에러율 상위 서비스', type: 'chart', size: 'medium' },
  { id: 'w2', title: '응답시간 추이', type: 'chart', size: 'large' },
];

export const MOCK_METRICS: any = {};
export const MOCK_AI_ANALYSIS: any = {};
export const MOCK_CHAT_HISTORY = { messages: [] };
export const MOCK_THRESHOLDS = [];
export const MOCK_NOTIFICATIONS = [];
export const MOCK_USERS = { users: [] };
