/**
 * post-build script: out/ 디렉터리의 모든 HTML 파일 <head>에
 * <script src="/runtime-env.js"> 태그를 직접 삽입합니다.
 *
 * next/script의 beforeInteractive는 Static Export에서 HTML에 직접 삽입되지 않아
 * window.__runtime_config__ 가 API 클라이언트 초기화보다 늦게 실행되는 문제를 해결합니다.
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
const SCRIPT_TAG = '<script src="/runtime-env.js"></script>';

function injectIntoHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 이미 주입된 경우 스킵
  if (content.includes('src="/runtime-env.js"')) {
    return false;
  }

  // <head> 여는 태그 바로 다음에 삽입
  const headMatch = content.match(/<head[^>]*>/);
  if (!headMatch) {
    return false;
  }

  const insertPos = content.indexOf(headMatch[0]) + headMatch[0].length;
  content = content.slice(0, insertPos) + SCRIPT_TAG + content.slice(insertPos);

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      if (injectIntoHtml(fullPath)) {
        console.log(`  injected: ${path.relative(OUT_DIR, fullPath)}`);
        count++;
      }
    }
  }
  return count;
}

console.log('[inject-runtime-env] HTML 파일에 runtime-env.js 스크립트 태그 주입 중...');
const total = walkDir(OUT_DIR);
console.log(`[inject-runtime-env] 완료: ${total}개 파일 처리됨`);
