# Ops AI Frontend

AI 기반 인프라 모니터링 시스템의 프론트엔드 애플리케이션

## 목차

- [개요](#개요)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [스크립트](#스크립트)
- [아키텍처](#아키텍처)
- [주요 기능](#주요-기능)
- [API 연동](#api-연동)
- [배포](#배포)

## 개요

Ops AI Frontend는 인프라 운영팀을 위한 실시간 모니터링 대시보드입니다. 인시던트 관리, AI 분석, 커스텀 위젯, 알림 설정 등의 기능을 제공합니다.

### 주요 화면

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/dashboard` | 대시보드 (인시던트 탭, 커스텀 Wall 탭) |
| `/dashboard/incident-wall` | 인시던트 월 (전체 화면) |
| `/settings` | 설정 (임계값, 알림, 사용자 관리) |

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Framework** | Next.js (App Router, Turbopack) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Component Library** | MUI (Material UI) | 5.18.0 |
| **상태 관리** | Redux Toolkit | 2.11.2 |
| **서버 상태** | TanStack React Query | 5.90.21 |
| **HTTP Client** | Axios | 1.13.5 |
| **차트** | Recharts | 3.7.0 |
| **마크다운** | react-markdown | 10.1.0 |
| **날짜 처리** | Day.js | 1.11.19 |
| **Language** | TypeScript | 5.x |

## 프로젝트 구조

[Feature-Sliced Design (FSD)](https://feature-sliced.design/) 아키텍처를 따릅니다.

```
frontend-app/
├── app/                          # App 레이어 — 라우팅, 레이아웃, 페이지
│   ├── layout.tsx                #   루트 레이아웃 (프로바이더, 인증 가드)
│   ├── page.tsx                  #   루트 페이지 (대시보드 리다이렉트)
│   ├── dashboard/
│   │   ├── page.tsx              #   대시보드 메인 페이지
│   │   └── incident-wall/
│   │       └── page.tsx          #   인시던트 월 전체 화면
│   ├── login/
│   │   └── page.tsx              #   로그인 페이지
│   └── settings/
│       └── page.tsx              #   설정 페이지
│
├── widgets/                      # Widgets 레이어 — 페이지 단위 복합 컴포넌트
│   ├── dashboard-layout/         #   공통 레이아웃 (헤더, 채팅, 스낵바)
│   ├── incident-tab/             #   인시던트 탭 (필터, 정렬, 목록)
│   ├── custom-wall-tab/          #   커스텀 Wall 탭 (위젯 그리드)
│   └── chat-panel/               #   AI 채팅 패널
│
├── features/                     # Features 레이어 — 비즈니스 기능 단위
│   ├── auth/                     #   인증 (로그인, 가드, 토큰 관리)
│   │   ├── api/                  #     API 호출
│   │   ├── model/                #     Redux 슬라이스
│   │   └── ui/                   #     AuthGuard 컴포넌트
│   ├── incidents/                #   인시던트 관리
│   │   ├── api/                  #     인시던트·AI 분석 API
│   │   ├── model/                #     React Query 훅
│   │   └── ui/                   #     카드, 드로어, 다이얼로그
│   ├── dashboard/                #   대시보드 위젯
│   │   ├── api/                  #     위젯·메트릭 API
│   │   ├── model/                #     React Query 훅
│   │   └── ui/                   #     WidgetCard, MiniChart
│   ├── settings/                 #   설정 관리
│   │   ├── api/                  #     임계값·알림·사용자 API
│   │   ├── model/                #     React Query 훅
│   │   └── ui/                   #     탭별 설정 컴포넌트
│   └── chat/                     #   AI 채팅
│       ├── api/                  #     채팅 API
│       └── model/                #     React Query 훅
│
├── entities/                     # Entities 레이어 — 도메인 타입 정의
│   ├── auth/                     #   User, LoginRequest, AuthState
│   ├── incident/                 #   Incident, Severity, AIAnalysis
│   ├── dashboard/                #   Widget, ChartDataPoint, MetricData
│   ├── chat/                     #   ChatMessage, ChatQueryRequest
│   └── settings/                 #   Threshold, NotificationSettings
│
├── shared/                       # Shared 레이어 — 공통 인프라
│   ├── api/                      #   Axios 클라이언트, Mock 인터셉터
│   │   └── mock/                 #     Mock 데이터 및 어댑터
│   ├── lib/                      #   React Query 클라이언트, 프로바이더
│   ├── store/                    #   Redux 스토어, 훅, UI 슬라이스
│   │   └── slices/               #     uiSlice (채팅 패널, 스낵바)
│   ├── styles/                   #   글로벌 CSS
│   ├── theme/                    #   MUI 다크 테마 설정
│   └── ui/                       #   공용 UI 컴포넌트 (Chip, Button)
│
└── public/                       # 정적 파일
    └── runtime-env.js            #   런타임 환경 변수 주입
```

### FSD 레이어 의존성 규칙

```
app → widgets → features → entities → shared
```

상위 레이어는 하위 레이어만 참조할 수 있으며, 역방향 의존은 허용되지 않습니다. 각 슬라이스는 `index.ts` 배럴 파일을 통해 Public API를 노출합니다.

## 시작하기

### 사전 요구사항

- **Node.js** 20.x 이상
- **npm** 10.x 이상

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

> Mock 모드가 기본 활성화되어 있어 백엔드 없이 더미 데이터로 테스트할 수 있습니다.

### 테스트 계정 (Mock 모드)

| 항목 | 값 |
|------|-----|
| 아이디 | `operator123` |
| 비밀번호 | `1234` |

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하여 환경 변수를 설정합니다.

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_MOCK_MODE` | Mock 모드 활성화 | `true` |
| `NEXT_PUBLIC_API_GROUP` | API 버전 경로 프리픽스 | `/api/v1` |
| `NEXT_PUBLIC_AUTH_API_URL` | 인증 서비스 URL | `http://localhost:8081` |
| `NEXT_PUBLIC_DASHBOARD_API_URL` | 대시보드 서비스 URL | `http://localhost:8082` |
| `NEXT_PUBLIC_INCIDENT_API_URL` | 인시던트 서비스 URL | `http://localhost:8083` |
| `NEXT_PUBLIC_AI_API_URL` | AI 분석 서비스 URL | `http://localhost:8084` |
| `NEXT_PUBLIC_CHAT_API_URL` | 채팅 서비스 URL | `http://localhost:8085` |
| `NEXT_PUBLIC_SETTINGS_API_URL` | 설정 서비스 URL | `http://localhost:8086` |
| `NEXT_PUBLIC_POLLING_INTERVAL` | 데이터 폴링 주기 (ms) | `30000` |
| `NEXT_PUBLIC_AI_POLLING_INTERVAL` | AI 분석 폴링 주기 (ms) | `5000` |

### 런타임 환경 변수

컨테이너 배포 시 `public/runtime-env.js`를 통해 빌드 이후에도 환경 변수를 주입할 수 있습니다. 이를 통해 단일 이미지로 여러 환경(개발, 스테이징, 운영)에 배포할 수 있습니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 코드 검사 |

## 아키텍처

### 상태 관리 전략

| 종류 | 도구 | 용도 |
|------|------|------|
| **클라이언트 상태** | Redux Toolkit | 인증 토큰, UI 상태 (채팅 패널 열림, 스낵바) |
| **서버 상태** | TanStack React Query | API 데이터 캐싱, 폴링, 뮤테이션 |

### 인증 흐름

```
로그인 → JWT 토큰 발급 → Redux에 저장 → Axios 인터셉터에서 자동 첨부
                                       → AuthGuard에서 미인증 시 /login 리다이렉트
```

### Mock 모드

`NEXT_PUBLIC_MOCK_MODE=true` 설정 시 Axios 어댑터 레벨에서 API 요청을 가로채어 미리 정의된 Mock 데이터를 반환합니다. 백엔드 서비스 없이 프론트엔드를 독립적으로 개발하고 테스트할 수 있습니다.

## 주요 기능

### 인시던트 관리
- 심각도별 필터링 (Critical, Major, Minor)
- 해결 상태 필터 (미해결, 해결됨)
- 최신순 / 위험도순 정렬
- 인시던트 상세 드로어 (확인, 뮤트, 해결)
- AI 분석 요청 및 결과 조회

### 커스텀 대시보드
- 위젯 추가 / 삭제
- 드래그 앤 드롭 위젯 정렬
- 실시간 메트릭 차트

### AI 채팅
- 자연어 기반 인프라 질의
- 마크다운 형식 응답 렌더링
- 채팅 히스토리 관리

### 설정
- 메트릭별 임계값 설정
- 알림 채널 관리 (이메일, Slack, Webhook)
- 사용자 계정 관리 (CRUD, 역할 설정)

## API 연동

마이크로서비스 아키텍처 기반으로 6개의 백엔드 서비스와 연동합니다.

| 서비스 | 포트 | 기능 |
|--------|------|------|
| Auth API | 8081 | 인증, 토큰 발급 |
| Dashboard API | 8082 | 위젯, 메트릭 데이터 |
| Incident API | 8083 | 인시던트 CRUD, 상태 변경 |
| AI API | 8084 | AI 분석 요청, 결과 조회 |
| Chat API | 8085 | AI 채팅 질의응답 |
| Settings API | 8086 | 임계값, 알림, 사용자 설정 |

## 배포

### 배포 환경

| 항목 | 내용 |
|------|------|
| 대상 서버 OS | Oracle Linux 6.5 / RHEL 6.5 |
| 웹서버 | Apache 2.2.29 |
| 포트 | 19090 |
| 빌드 방식 | Static Export (Node.js 불필요) |
| 네트워크 | 망분리 환경 (외부망 차단) |

### 빌드 방법 (로컬 - 외부망)

```bash
# 1. 의존성 설치
npm install

# 2. Static Export 빌드
npm run build
```

빌드 완료 후 `out/` 디렉토리에 순수 HTML/CSS/JS 파일이 생성됩니다.

> `next.config.ts`에 `output: 'export'`가 설정되어 있어 Node.js 없이 정적 파일만으로 실행 가능합니다.

### 산출물 압축 (로컬)

```bash
tar -czf bmon-ops-frontend.tar.gz -C out .
```

반입 파일: `bmon-ops-frontend.tar.gz` (1개)

### 서버 배포 (망분리 서버)

#### 1. 디렉토리 구조 생성

```bash
mkdir -p /app/bmon-ops/{conf,html}
```

```
/app/bmon-ops/
├── conf/
│   └── httpd.conf        # 독립 Apache 설정
├── html/                  # 프론트엔드 산출물
├── start.sh               # 기동 스크립트
└── stop.sh                # 종료 스크립트
```

#### 2. 산출물 배치

```bash
tar -xzf bmon-ops-frontend.tar.gz -C /app/bmon-ops/html
```

#### 3. Apache 설정 파일 생성

```bash
vi /app/bmon-ops/conf/httpd.conf
```

```apache
# 독립 인스턴스 설정 (기존 Apache와 완전 분리)
ServerRoot "/etc/httpd"
PidFile /app/bmon-ops/httpd.pid
Listen 19090

LoadModule authz_host_module modules/mod_authz_host.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule mime_module modules/mod_mime.so
LoadModule dir_module modules/mod_dir.so
LoadModule rewrite_module modules/mod_rewrite.so

TypesConfig /etc/mime.types
DirectoryIndex index.html

ErrorLog /dev/null
CustomLog /dev/null combined

DocumentRoot "/app/bmon-ops/html"

<Directory "/app/bmon-ops/html">
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Order allow,deny
    Allow from all
</Directory>

# SPA 라우팅 지원
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### 4. 기동 스크립트 생성

```bash
vi /app/bmon-ops/start.sh
```

```sh
#!/bin/sh

APP_NAME="bmon-ops"
APP_HOME="/app/bmon-ops"
APP_PORT="19090"
CONF_HOME="$APP_HOME/conf"
HTTPD_BIN="/usr/sbin/httpd"

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`
echo $PID

if [ e$PID != "e" ]
then
    echo "$APP_NAME is already RUNNING... (PID: $PID)"
    exit;
fi

$HTTPD_BIN -f $CONF_HOME/httpd.conf -k start

if [ e$1 = "enotail" ]
then
    echo "Starting... $APP_NAME"
    exit;
fi

sleep 1
echo "$APP_NAME started. (PORT: $APP_PORT)"
```

#### 5. 종료 스크립트 생성

```bash
vi /app/bmon-ops/stop.sh
```

```sh
#!/bin/sh

APP_NAME="bmon-ops"
APP_HOME="/app/bmon-ops"
CONF_HOME="$APP_HOME/conf"
HTTPD_BIN="/usr/sbin/httpd"

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`

if [ e$PID = "e" ]
then
    echo "$APP_NAME is not RUNNING..."
    exit;
fi

echo "Stopping $APP_NAME... (PID: $PID)"

$HTTPD_BIN -f $CONF_HOME/httpd.conf -k stop

sleep 1

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`
if [ e$PID = "e" ]
then
    echo "$APP_NAME stopped."
else
    echo "$APP_NAME stop failed. force kill... (PID: $PID)"
    kill -9 $PID
    echo "$APP_NAME killed."
fi
```

#### 6. 실행 권한 부여

```bash
chmod +x /app/bmon-ops/start.sh
chmod +x /app/bmon-ops/stop.sh
```

### 서비스 기동/종료

```bash
/app/bmon-ops/start.sh           # 기동
/app/bmon-ops/start.sh notail    # 기동 (메시지 없이)
/app/bmon-ops/stop.sh            # 종료
```

### 접속

```
http://서버IP:19090
```

### 테스트 계정 (Mock 모드)

| 항목 | 값 |
|------|-----|
| 아이디 | `operator123` |
| 비밀번호 | `1234` |

### 재배포 방법

1. 로컬에서 `npm run build` 실행
2. `tar -czf bmon-ops-frontend.tar.gz -C out .` 압축
3. 서버에서 `/app/bmon-ops/stop.sh` 종료
4. `tar -xzf bmon-ops-frontend.tar.gz -C /app/bmon-ops/html` 산출물 교체
5. `/app/bmon-ops/start.sh` 기동
