# 프론트엔드 개발 가이드

[Git 연동]

- "pull" 명령어 입력 시 Git pull 명령을 수행하고 충돌이 있을 때 최신 파일로 병합 수행
- "push" 또는 "푸시" 명령어 입력 시 git add, commit, push를 수행
- Commit Message는 한글로 함

[URL링크 참조]

- URL링크는 WebFetch가 아닌 'curl {URL} > claude/{filename}'명령으로 저장
- 동일한 파일이 있으면 덮어 씀
- 'claude'디렉토리가 없으면 생성하고 다운로드
- 저장된 파일을 읽어 사용함

## 기술 스택

- Framework: Next.js 16.1.6 (App Router, Turbopack)
- UI: React 19.2.3 + MUI 5.18.0
- 상태관리: Redux Toolkit 2.11.2 + TanStack React Query 5.90.21
- Language: TypeScript 5.x
- 아키텍처: Feature-Sliced Design (FSD)

## 가이드

- 프론트엔드설계가이드
  - 설명: 프론트엔드 설계 방법 안내
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/design/frontend-design.md
  - 파일명: frontend-design.md
- 프론트엔드개발가이드
  - 설명: 프론트엔드 개발 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/develop/dev-frontend.md
  - 파일명: dev-frontend.md
- 프론트엔드컨테이너이미지작성가이드
  - 설명: 프론트엔드 컨테이너 이미지 작성 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/build-image-front.md
  - 파일명: build-image-front.md
- 프론트엔드컨테이너실행방법가이드
  - 설명: 프론트엔드 컨테이너 실행방법 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/run-container-guide-front.md
  - 파일명: run-container-guide-front.md
- 프론트엔드배포가이드
  - 설명: 프론트엔드 서비스를 쿠버네티스 클러스터에 배포하는 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-k8s-front.md
  - 파일명: deploy-k8s-front.md
- 프론트엔드Jenkins파이프라인작성가이드
  - 설명: 프론트엔드 서비스를 Jenkins를 이용하여 CI/CD하는 배포 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-jenkins-cicd-front.md
  - 파일명: deploy-jenkins-cicd-front.md
- 프론트엔드GitHubActions파이프라인작성가이드
  - 설명: 프론트엔드 서비스를 GitHub Actions를 이용하여 CI/CD하는 배포 가이드
  - URL: https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-actions-cicd-front.md
  - 파일명: deploy-actions-cicd-front.md

## 프롬프트 약어

### 역할 약어

- "@front": "--persona-front"
- "@devops": "--persona-devops"

### 작업 약어

- "@complex-flag": --seq --c7 --uc --wave-mode auto --wave-strategy systematic --delegate auto

- "@plan": --plan --think
- "@dev-front": /sc:implement @front --think-hard @complex-flag
- "@cicd": /sc:implement @devops --think @complex-flag
- "@document": /sc:document --think @scribe @complex-flag
- "@fix": /sc:troubleshoot --think @complex-flag
- "@estimate": /sc:estimate --think-hard @complex-flag
- "@improve": /sc:improve --think @complex-flag
- "@analyze": /sc:analyze --think --seq
- "@explain": /sc:explain --think --seq --answer-only

## Lessons Learned

**프론트엔드 개발 절차**:

- 개발가이드의 "6. 각 페이지별 구현" 단계에서는 빌드 및 에러 해결까지만 수행
- 개발서버(`npm run dev`) 실행은 항상 사용자가 직접 수행
- 개발자는 빌드(`npm run build`) 성공까지만 확인하고 서버 실행을 사용자에게 요청
- 개발자가 임의로 서버를 실행하고 테스트하지 않고 사용자 확인 후 진행

**서비스 재배포 가이드**
서비스 수정 후 재배포 시 다음 절차를 따릅니다:

1. 이미지 빌드: deployment/container/build-image.md 참조하여 빌드
2. 이미지를 ACR형식으로 태깅
3. 컨테이너 실행: deployment/container/run-container-guide.md의 '8. 재배포 방법' 참조하여 실행
   - 컨테이너 중단
   - 이미지 삭제
   - 컨테이너 실행

- 테스트는 사용자에게 요청

## 관련 Repo

- 기획/설계: bmon-ops-planning
- AI 에이전트 백엔드: bmon-ops-ai-agent
