// 공용 유틸: 이스케이프, 날짜, 세션/CSRF, 속도 제한, 마크다운
export const CATS = { flight: '항공권', hotel: '호텔', tour: '투어·액티비티', transport: '교통·기차', etc: '기타' };
export const CAT_ICON = { flight: '✈️', hotel: '🏨', tour: '🎟️', transport: '🚆', etc: '🧳' };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
export const fmtDate = (ts) => new Date(ts * 1000 + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '.');
export const isoDate = (ts) => new Date(ts * 1000).toISOString();
export const slugify = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
export const xmlEsc = esc;

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return atob(s); };

async function hmacRaw(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(data));
}
export const hmac = async (secret, data) => b64u(await hmacRaw(secret, data));

// 길이·내용과 무관하게 일정 시간에 비교
export async function safeEqual(a, b, secret) {
  const [x, y] = await Promise.all([hmacRaw(secret, 'eq:' + a), hmacRaw(secret, 'eq:' + b)]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(x, y);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

export async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- 세션 / CSRF ---------- */
const SESSION_TTL = 8 * 3600;
export const cookieName = (url) => (url.protocol === 'https:' ? '__Host-tsess' : 'tsess');

export function getCookie(req, name) {
  const c = req.headers.get('Cookie') || '';
  for (const part of c.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

export async function makeSession(env) {
  const p = b64u(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL, n: crypto.randomUUID() })));
  return p + '.' + (await hmac(env.SESSION_SECRET, 's.' + p));
}

export async function readSession(env, req, url) {
  const t = getCookie(req, cookieName(url));
  const i = t.indexOf('.');
  if (i < 1) return null;
  const p = t.slice(0, i), sig = t.slice(i + 1);
  const good = await hmac(env.SESSION_SECRET, 's.' + p);
  if (!(await safeEqual(sig, good, env.SESSION_SECRET))) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(unb64u(p), (c) => c.charCodeAt(0))));
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    return { token: t };
  } catch { return null; }
}

export const csrfToken = (env, token) => hmac(env.SESSION_SECRET, 'c.' + token);

export function sessionCookie(url, value, maxAge) {
  return `${cookieName(url)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` + (url.protocol === 'https:' ? '; Secure' : '');
}

// 같은 출처에서 온 요청만 허용 (CSRF 2차 방어)
export function sameOrigin(req, url) {
  const o = req.headers.get('Origin');
  if (o) { try { return new URL(o).host === url.host; } catch { return false; } }
  const f = req.headers.get('Sec-Fetch-Site');
  return !f || f === 'same-origin' || f === 'none';
}

/* ---------- 속도 제한 (D1) ---------- */
export async function ipKey(env, req, scope) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  return scope + ':' + (await sha(ip + '|' + env.SESSION_SECRET)).slice(0, 24);
}
export async function rlCount(env, key, windowSec) {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE key=? AND ts>?').bind(key, Math.floor(Date.now() / 1000) - windowSec).first();
  return r?.n || 0;
}
export async function rlHit(env, key) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO rate_limits(key, ts) VALUES(?, ?)').bind(key, now),
    env.DB.prepare('DELETE FROM rate_limits WHERE ts<?').bind(now - 86400),
  ]);
}
export const rlClear = (env, key) => env.DB.prepare('DELETE FROM rate_limits WHERE key=?').bind(key).run();

/* ---------- 보안 헤더 ---------- */
export function secure(res, { admin = false } = {}) {
  const h = new Headers(res.headers);
  h.set('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (admin) { h.set('Cache-Control', 'no-store'); h.set('X-Robots-Tag', 'noindex, nofollow, noarchive'); }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

/* ---------- 마크다운 (안전한 부분집합: 먼저 이스케이프한 뒤 변환) ---------- */
function linkHtml(text, url) {
  const ext = !url.startsWith('/') || url.startsWith('//');
  const rel = ext ? (/^https?:\/\/([^/]*\.)?trip\.com/i.test(url) ? 'sponsored nofollow noopener' : 'nofollow noopener') : '';
  return `<a href="${url}"${ext ? ` target="_blank" rel="${rel}"` : ''}>${text}</a>`;
}
function inline(t) {
  let s = esc(t);
  s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (m, a, u) => `<img src="${u}" alt="${a}" loading="lazy" decoding="async">`);
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]*)\)/g, (m, a, u) => linkHtml(a, u));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s;
}
// 블록 배열로 반환 (글 중간에 쿠폰을 끼워 넣기 위해)
export function mdBlocks(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  const out = [];
  const isUl = (l) => /^\s*[-*]\s+/.test(l), isOl = (l) => /^\s*\d+\.\s+/.test(l);
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,3})\s+(.+)$/))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (isUl(l) || isOl(l)) {
      const ol = isOl(l), items = [];
      while (i < lines.length && (ol ? isOl(lines[i]) : isUl(lines[i]))) { items.push(`<li>${inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`); i++; }
      out.push(ol ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`); continue;
    }
    if (/^>\s?/.test(l)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${inline(q.join('\n')).replace(/\n/g, '<br>')}</blockquote>`); continue;
    }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|---+\s*$|>\s?)/.test(lines[i]) && !isUl(lines[i]) && !isOl(lines[i])) { p.push(lines[i]); i++; }
    out.push(`<p>${inline(p.join('\n')).replace(/\n/g, '<br>')}</p>`);
  }
  return out;
}
export const md = (s) => mdBlocks(s).join('\n');

export function fill(text, s) {
  return String(text || '')
    .replaceAll('{{site_name}}', s.site_name)
    .replaceAll('{{contact_email}}', s.contact_email || '문의 페이지의 양식')
    .replaceAll('{{operator}}', s.operator_name || s.site_name + ' 운영자')
    .replaceAll('{{site_url}}', s.base);
}

export function cleanSource(v) {
  v = String(v || '');
  return v.startsWith('/') && !v.startsWith('//') ? v.slice(0, 120) : '';
}
