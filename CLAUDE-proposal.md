# 프론트엔드 개발 가이드

## 기술 스택

- Next.js 16.1.6 (App Router, Turbopack)
- React 19.2.3 + MUI 5.18.0
- Redux Toolkit 2.11.2 + TanStack React Query 5.90.21
- TypeScript 5.x
- Feature-Sliced Design (FSD)

## Git 규칙

- Commit Message는 한글로 작성
- "pull" 입력 시: git pull 수행, 충돌 시 최신 파일 기준 병합
- "push" 입력 시: git diff로 변경 내용 표시 → 사용자 확인 → git add, commit, push

## 개발 절차

1. 설계 가이드 확인 → Plan 모드로 구현 계획 수립
2. 코드 구현
3. `npm run build` 성공 확인
4. 사용자에게 `npm run dev` 실행 및 테스트 요청
- 개발서버 실행과 테스트는 항상 사용자가 직접 수행

## 재배포 절차

1. deployment/container/build-image.md 참조하여 이미지 빌드
2. ACR 형식으로 태깅
3. deployment/container/run-container-guide.md '8. 재배포 방법' 참조
   - 컨테이너 중단 → 이미지 삭제 → 컨테이너 실행
4. 테스트는 사용자에게 요청

## 가이드 참조

필요 시 아래 URL을 curl로 다운로드하여 사용:

| 가이드 | 파일명 |
|--------|--------|
| [프론트엔드설계](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/design/frontend-design.md) | frontend-design.md |
| [프론트엔드개발](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/develop/dev-frontend.md) | dev-frontend.md |
| [컨테이너이미지작성](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/build-image-front.md) | build-image-front.md |
| [컨테이너실행방법](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/run-container-guide-front.md) | run-container-guide-front.md |
| [K8s배포](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-k8s-front.md) | deploy-k8s-front.md |
| [Jenkins CI/CD](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-jenkins-cicd-front.md) | deploy-jenkins-cicd-front.md |
| [GitHub Actions CI/CD](https://raw.githubusercontent.com/cna-bootcamp/clauding-guide/refs/heads/main/guides/deploy/deploy-actions-cicd-front.md) | deploy-actions-cicd-front.md |

- URL은 `curl {URL} > claude/{파일명}`으로 다운로드
- claude 디렉토리가 없으면 생성 후 다운로드

## 관련 Repo

- 기획/설계: bmon-ops-planning
- AI 에이전트 백엔드: bmon-ops-ai-agent
