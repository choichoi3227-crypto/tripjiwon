import { secure } from './lib.js';
import { SITE_CSS, SITE_JS, FAVICON, ADMIN_CSS } from './assets.js';
import * as P from './pages.js';
import { admin } from './admin.js';

const asset = (body, type) => new Response(body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } });
const plain = (msg, status) => new Response(msg, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

export default {
  async fetch(req, env, ctx) {
    try {
      const res = await route(req, env, ctx);
      const isAdmin = res.headers.get('x-admin') === '1';
      return secure(res, { admin: isAdmin });
    } catch (e) {
      console.error('unhandled', e?.stack || e);
      return secure(plain('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500));
    }
  },
};

async function route(req, env, ctx) {
  const url = new URL(req.url);
  let path = url.pathname;
  const method = req.method === 'HEAD' ? 'GET' : req.method;

  // 관리자 (경로는 환경변수로 변경 가능)
  let A = (env.ADMIN_PATH || '/admin').trim();
  if (!A.startsWith('/')) A = '/' + A;
  A = A.replace(/\/+$/, '') || '/admin';
  if (path === A || path.startsWith(A + '/')) {
    const r = await admin(req, env, ctx, url, A);
    const h = new Headers(r.headers); h.set('x-admin', '1');
    return new Response(r.body, { status: r.status, headers: h });
  }

  if (path.length > 1 && path.endsWith('/')) { url.pathname = path.replace(/\/+$/, ''); return Response.redirect(url.toString(), 301); }

  // 정적 자산
  if (path === '/assets/site.css') return asset(SITE_CSS, 'text/css; charset=utf-8');
  if (path === '/assets/admin.css') return asset(ADMIN_CSS, 'text/css; charset=utf-8');
  if (path === '/assets/app.js') return asset(SITE_JS, 'application/javascript; charset=utf-8');
  if (path === '/favicon.svg' || path === '/favicon.ico') return asset(FAVICON, 'image/svg+xml');

  // 문의 접수
  if (path === '/contact' && req.method === 'POST') return P.contactPost(req, env, url);
  if (method !== 'GET') return plain('Method Not Allowed', 405);

  // 클릭 리다이렉트 (캐시하지 않음)
  const g = path.match(/^\/go\/(\d{1,9})$/);
  if (g) return P.go(req, env, ctx, url, +g[1]);

  // 공개 페이지: 엣지 캐시 (관리자가 저장하면 버전이 올라 즉시 갱신)
  const ver = (await env.DB.prepare("SELECT value FROM settings WHERE key='cache_v'").first())?.value || '1';
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(`${url.origin}${path}${url.search}${url.search ? '&' : '?'}__v=${ver}`);
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }

  const res = await render(env, ctx, url, path);
  if (cache && res.status === 200) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function render(env, ctx, url, path) {
  const s = await P.loadSettings(env, url);
  const seg = path.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  let r = null;

  if (path === '/') return P.home(env, s);
  if (path === '/robots.txt') return P.robots(s);
  if (path === '/sitemap.xml') return P.sitemap(env, s);
  if (path === '/rss.xml') return P.rss(env, s);
  if (path === '/.well-known/security.txt') return P.securityTxt(s);
  if (path === '/coupons') return P.couponsPage(env, s, url);
  if (path === '/guide') return P.guideList(env, s);
  if (path === '/notice') return P.noticeIndex(env, s);
  if (seg[0] === 'guide' && seg.length === 2) r = await P.guidePost(env, s, seg[1]);
  else if (seg[0] === 'notice' && seg.length === 2) r = await P.noticePage(env, s, seg[1]);
  else if (seg.length === 1) r = await P.legalPage(env, s, seg[0], url);
  return r || P.notFound(env, s);
}
