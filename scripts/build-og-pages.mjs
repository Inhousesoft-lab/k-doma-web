/**
 * 요리별 공유 미리보기 페이지 만들기 (vite build 다음에 실행)
 *
 * 카카오톡 같은 메신저는 자바스크립트를 실행하지 않고 HTML의 og 태그만 읽는다.
 * 그래서 dist/index.html을 요리마다 복사해 제목·설명·사진만 그 요리 것으로 바꾼
 * dist/recipe/{id}.html을 만든다. Netlify는 /recipe/{id} 요청에 이 파일을 먼저 돌려주고,
 * 화면은 지금처럼 앱이 띄운다.
 *
 * 사이트 주소: VITE_SITE_URL → Netlify가 빌드 때 주는 URL. 둘 다 없으면 사진 주소를
 * 상대 경로로 둔다(로컬 빌드용. 메신저는 절대 주소가 있어야 사진을 보여 준다).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const recipes = JSON.parse(readFileSync(join(root, 'src/data/recipes.json'), 'utf8'));
const template = readFileSync(join(distDir, 'index.html'), 'utf8');

const siteUrl = (process.env.VITE_SITE_URL || process.env.URL || '').replace(/\/+$/, '');
if (!siteUrl) {
  console.warn('[og] VITE_SITE_URL·URL이 없어 사진·링크 주소를 상대 경로로 둡니다 (로컬 빌드)');
}

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 원본 index.html의 공통 메타(제목·설명·og 제목·og 설명)를 찾는 패턴
const patterns = {
  title: /<title>[\s\S]*?<\/title>/,
  description: /<meta name="description" content="[^"]*"\s*\/?>/,
  ogTitle: /<meta property="og:title" content="[^"]*"\s*\/?>/,
  ogDescription: /<meta property="og:description" content="[^"]*"\s*\/?>/,
  ogType: /<meta property="og:type" content="[^"]*"\s*\/?>/,
};
for (const [key, re] of Object.entries(patterns)) {
  if (!re.test(template)) throw new Error(`[og] dist/index.html에서 ${key} 태그를 찾지 못했어요`);
}

mkdirSync(join(distDir, 'recipe'), { recursive: true });

let count = 0;
for (const recipe of recipes) {
  if (!recipe.id || !recipe.name) continue;

  const title = escapeHtml(`${recipe.name} · K-Doma`);
  const description = escapeHtml(recipe.description || `${recipe.name} 레시피 · K-Doma`);
  const pageUrl = `${siteUrl}/recipe/${encodeURIComponent(recipe.id)}`;
  const imageUrl = recipe.photoUrl
    ? /^https?:\/\//.test(recipe.photoUrl)
      ? recipe.photoUrl
      : `${siteUrl}${recipe.photoUrl.startsWith('/') ? '' : '/'}${recipe.photoUrl}`
    : '';

  const extra = [
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:site_name" content="K-Doma" />`,
    imageUrl && `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    imageUrl && `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');

  const html = template
    .replace(patterns.title, `<title>${title}</title>`)
    .replace(patterns.description, `<meta name="description" content="${description}" />`)
    .replace(patterns.ogTitle, `<meta property="og:title" content="${title}" />`)
    .replace(patterns.ogDescription, `<meta property="og:description" content="${description}" />`)
    .replace(patterns.ogType, `<meta property="og:type" content="article" />\n    ${extra}`);

  writeFileSync(join(distDir, 'recipe', `${recipe.id}.html`), html);
  count += 1;
}

console.log(`[og] 요리별 미리보기 페이지 ${count}개 생성 (dist/recipe/*.html)${siteUrl ? ` · ${siteUrl}` : ''}`);
