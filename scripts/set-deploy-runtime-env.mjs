/**
 * @file set-deploy-runtime-env.mjs
 * @description 빌드 직후 `out/runtime-env.js`를 배포용(dev 서버) 접속정보로 고정한다.
 *
 *   `public/runtime-env.js`는 로컬 테스트 중 localhost:19091로 바꿔두는 일이 잦은데,
 *   `next build`가 public/을 out/으로 그대로 복사하고 out/은 git 추적 대상이라
 *   원복을 잊으면 localhost 설정이 그대로 커밋·배포되어 서버 화면이 전부 깨진다.
 *   빌드 산출물만 되돌리므로 로컬 dev 서버(3000)는 계속 public/ 값을 쓴다.
 *
 *   ⚠️ 배포 대상이 바뀌면 아래 DEPLOY_HOST만 고치면 된다.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEPLOY_HOST = 'http://10.217.136.185:19091';
const TARGET = join(process.cwd(), 'out', 'runtime-env.js');

const CONTENT = `// 런타임 환경 변수 (dev 배포 — 실 백엔드 ${DEPLOY_HOST})
// ⚠️ 자동 생성: scripts/set-deploy-runtime-env.mjs (npm run build 후 실행)
//    직접 수정하지 말 것. 로컬 테스트는 public/runtime-env.js를 고칠 것.
window.__runtime_config__ = {
  API_GROUP: "/api/v1",
  DASHBOARD_HOST: "${DEPLOY_HOST}",
  INCIDENT_HOST: "${DEPLOY_HOST}",
  AI_HOST: "${DEPLOY_HOST}",
  CHAT_HOST: "${DEPLOY_HOST}",
};
`;

let before;
try {
  before = await readFile(TARGET, 'utf8');
} catch {
  console.error(`[runtime-env] ✗ ${TARGET} 없음 — next build가 먼저 실행되어야 합니다.`);
  process.exit(1);
}

if (before === CONTENT) {
  console.log(`[runtime-env] 배포용 설정 유지 (${DEPLOY_HOST})`);
} else {
  await writeFile(TARGET, CONTENT, 'utf8');
  // 따옴표로 감싼 HOST 값만 추출 (주석의 URL은 제외)
  const prev = [...before.matchAll(/_HOST:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const localHosts = [...new Set(prev)].join(', ');
  console.log(`[runtime-env] out/runtime-env.js 배포용으로 원복: ${localHosts || '(알 수 없음)'} → ${DEPLOY_HOST}`);
}
