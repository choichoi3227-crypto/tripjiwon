// 관리자: 로그인(속도 제한), 세션, CSRF, 쿠폰/글/페이지/문의/설정 관리
import { esc, CATS, slugify, fmtDate, today, safeEqual, makeSession, readSession, csrfToken, sessionCookie, sameOrigin, ipKey, rlCount, rlHit, rlClear } from './lib.js';
import { ASSET_V } from './pages.js';

const bump = (env) => env.DB.prepare("INSERT INTO settings(key,value) VALUES('cache_v','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1").run();
const PUB = [['published', '공개'], ['draft', '임시저장']];
const MD_HINT = '마크다운: ## 제목, **굵게**, - 목록, [링크](주소), ![설명](이미지주소) · {{site_name}} {{contact_email}} {{operator}} 사용 가능';

const ENT = {
  coupons: {
    label: '쿠폰', table: 'coupons', newDefaults: { active: 1, category: 'flight', priority: 0 },
    fields: [
      { n: 'title', l: '제목', t: 'text', req: 1, max: 120 },
      { n: 'url', l: '트립닷컴 제휴 링크', t: 'url', req: 1, max: 1500, hint: '제휴 대시보드에서 발급한 링크 전체를 붙여 넣으세요.' },
      { n: 'badge', l: '혜택 문구 (큰 글씨)', t: 'text', max: 40, hint: '예: 최대 12% 할인' },
      { n: 'category', l: '분류', t: 'select', opts: Object.entries(CATS) },
      { n: 'code', l: '쿠폰 코드 (있을 때만)', t: 'text', max: 40 },
      { n: 'description', l: '짧은 설명', t: 'textarea', max: 200 },
      { n: 'expire', l: '마감일 (비우면 상시)', t: 'date' },
      { n: 'image', l: '이미지 주소', t: 'url', max: 1500, hint: '비우면 분류 아이콘이 표시됩니다.' },
      { n: 'priority', l: '노출 우선순위 (숫자가 클수록 위)', t: 'number' },
      { n: 'featured', l: '추천 쿠폰으로 강조', t: 'check' },
      { n: 'active', l: '노출', t: 'check' },
    ],
    list: 'SELECT c.*, (SELECT COUNT(*) FROM clicks k WHERE k.coupon_id=c.id) AS clicks FROM coupons c ORDER BY c.priority DESC, c.id DESC LIMIT 300',
    cols: [['제목', (r) => esc(r.title)], ['분류', (r) => esc(CATS[r.category] || '')], ['마감', (r) => esc(r.expire || '상시')], ['클릭', (r) => r.clicks], ['상태', (r) => `<span class="tag${r.active ? '' : ' off'}">${r.active ? '노출' : '숨김'}</span>`]],
  },
  posts: {
    label: '쿠폰 안내 글', table: 'posts', newDefaults: { status: 'published' },
    fields: [
      { n: 'title', l: '제목', t: 'text', req: 1, max: 120 },
      { n: 'slug', l: '주소(슬러그)', t: 'slug', hint: '비우면 제목으로 자동 생성됩니다. 영문·숫자·하이픈 권장.' },
      { n: 'description', l: '요약 (검색 결과·공유에 표시, 120자 안팎)', t: 'textarea', max: 200 },
      { n: 'image', l: '대표 이미지 주소', t: 'url', max: 1500 },
      { n: 'body', l: '본문', t: 'textarea', big: 1, max: 60000, hint: MD_HINT },
      { n: 'status', l: '상태', t: 'select', opts: PUB },
    ],
    list: 'SELECT * FROM posts ORDER BY created_at DESC LIMIT 300',
    cols: [['제목', (r) => esc(r.title)], ['주소', (r) => '/guide/' + esc(r.slug)], ['작성', (r) => fmtDate(r.created_at)], ['상태', (r) => `<span class="tag${r.status === 'published' ? '' : ' off'}">${r.status === 'published' ? '공개' : '임시'}</span>`]],
  },
  pages: {
    label: '공지·페이지', table: 'pages', newDefaults: { status: 'published' },
    fields: [
      { n: 'title', l: '제목', t: 'text', req: 1, max: 120 },
      { n: 'slug', l: '주소(슬러그)', t: 'slug', hint: '새 페이지는 공지(/notice/주소)로 분류됩니다. 필수 페이지의 주소는 바꿀 수 없습니다.' },
      { n: 'description', l: '요약', t: 'textarea', max: 200 },
      { n: 'body', l: '본문', t: 'textarea', big: 1, max: 60000, hint: MD_HINT },
      { n: 'status', l: '상태', t: 'select', opts: PUB },
    ],
    list: 'SELECT * FROM pages ORDER BY (kind=\'legal\') ASC, created_at DESC LIMIT 300',
    cols: [['제목', (r) => esc(r.title)], ['구분', (r) => (r.kind === 'legal' ? '필수 페이지' : '공지')], ['주소', (r) => (r.kind === 'legal' ? '/' : '/notice/') + esc(r.slug)], ['상태', (r) => `<span class="tag${r.status === 'published' ? '' : ' off'}">${r.status === 'published' ? '공개' : '임시'}</span>`]],
  },
};

const SETTINGS = [
  { n: 'site_name', l: '사이트 이름', t: 'text', req: 1, max: 30 },
  { n: 'tagline', l: '한 줄 소개 (검색 결과 설명에 사용)', t: 'text', max: 80 },
  { n: 'hero_title', l: '홈 상단 제목', t: 'text', max: 60 },
  { n: 'hero_desc', l: '홈 상단 설명', t: 'textarea', max: 200 },
  { n: 'default_url', l: '기본 제휴 링크', t: 'url', max: 1500, hint: '쿠폰 링크가 비었을 때 쓰입니다.' },
  { n: 'extra_params', l: '제휴 링크에 추가할 파라미터', t: 'text', max: 200, hint: '예: sub_id={coupon_id}&src={source} (트립닷컴 제휴 대시보드가 지원하는 이름을 확인해서 입력)' },
  { n: 'disclosure', l: '제휴 고지 문구', t: 'textarea', max: 500, hint: '글 상단과 푸터에 표시됩니다.' },
  { n: 'operator_name', l: '운영자 이름', t: 'text', max: 50, hint: '개인정보처리방침·소개 페이지에 표시됩니다.' },
  { n: 'contact_email', l: '문의 이메일', t: 'email', max: 120 },
  { n: 'site_url', l: '정식 도메인 주소', t: 'url', max: 200, hint: '예: https://example.com (canonical·사이트맵에 사용. wrangler의 SITE_URL이 우선합니다)' },
  { n: 'og_image', l: '공유 이미지 주소 (1200×630 PNG/JPG 권장)', t: 'url', max: 1500 },
  { n: 'cf_beacon', l: 'Cloudflare Web Analytics 토큰', t: 'text', max: 40, hint: '비우면 사용하지 않습니다.' },
  { n: 'google_verify', l: '구글 서치콘솔 인증 코드', t: 'text', max: 100 },
  { n: 'naver_verify', l: '네이버 서치어드바이저 인증 코드', t: 'text', max: 100 },
];

/* ---------- 폼 값 검증 ---------- */
function clean(f, form) {
  let v = form.get(f.n);
  if (f.t === 'check') return { v: form.has(f.n) ? 1 : 0 };
  v = String(v ?? '').trim();
  if (f.req && !v) return { err: `${f.l}을(를) 입력하세요.` };
  if (f.max && v.length > f.max) return { err: `${f.l}은(는) ${f.max}자 이하여야 합니다.` };
  if (f.t === 'url' && v) { try { if (!/^https?:$/.test(new URL(v).protocol)) throw 0; } catch { return { err: `${f.l}은(는) http(s):// 로 시작하는 올바른 주소여야 합니다.` }; } }
  if (f.t === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { err: '이메일 형식이 올바르지 않습니다.' };
  if (f.t === 'date' && v && !(/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)))) return { err: '마감일 형식이 올바르지 않습니다.' };
  if (f.t === 'number') return { v: Math.max(-9999, Math.min(9999, parseInt(v, 10) || 0)) };
  if (f.t === 'select' && !f.opts.some(([k]) => k === v)) return { err: `${f.l} 값이 올바르지 않습니다.` };
  return { v };
}

/* ---------- 화면 조각 ---------- */
const FLASH = { saved: '저장했습니다.', deleted: '삭제했습니다.', pw: '' };
function shell(A, title, body, { csrf, active, ok } = {}) {
  const nav = [['', '대시보드'], ['/coupons', '쿠폰'], ['/posts', '쿠폰 안내 글'], ['/pages', '공지·페이지'], ['/messages', '문의함'], ['/settings', '설정']]
    .map(([p, t]) => `<a href="${A}${p}"${active === p ? ' class="on"' : ''}>${t}</a>`).join('');
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${esc(title)} - 관리자</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/assets/admin.css?v=${ASSET_V}"></head><body>
${csrf ? `<div class="shell"><aside class="side"><h1>트립지원닷컴 관리</h1>${nav}<a href="/" target="_blank" rel="noopener">사이트 보기 ↗</a><form method="post" action="${A}/logout"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="btn sec" style="width:100%">로그아웃</button></form></aside><div class="main">${FLASH[ok] ? `<div class="ok" role="status">${FLASH[ok]}</div>` : ''}${body}</div></div>` : body}
<script src="/assets/app.js?v=${ASSET_V}" defer></script></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
const redirect = (to, headers = {}) => new Response(null, { status: 303, headers: { Location: to, ...headers } });

function field(f, val, locked) {
  const id = 'f_' + f.n, hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  val = val ?? '';
  if (f.t === 'check') return `<label class="ck"><input type="checkbox" name="${f.n}" ${+val ? 'checked' : ''}> ${esc(f.l)}</label>`;
  if (f.t === 'textarea') return `<label for="${id}">${esc(f.l)}<textarea id="${id}" name="${f.n}"${f.big ? ' class="big"' : ''} maxlength="${f.max || 5000}">${esc(val)}</textarea>${hint}</label>`;
  if (f.t === 'select') return `<label for="${id}">${esc(f.l)}<select id="${id}" name="${f.n}">${f.opts.map(([k, v]) => `<option value="${esc(k)}"${k === val ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
  const type = f.t === 'slug' ? 'text' : f.t;
  return `<label for="${id}">${esc(f.l)}<input id="${id}" type="${type}" name="${f.n}" value="${esc(val)}"${f.max ? ` maxlength="${f.max}"` : ''}${f.req ? ' required' : ''}${locked ? ' readonly' : ''}>${hint}</label>`;
}

function formPage(A, name, E, vals, id, errs, csrf, row) {
  const legal = row?.kind === 'legal';
  const body = `<h2>${id ? E.label + ' 수정' : '새 ' + E.label}</h2>
${errs?.length ? `<div class="err" role="alert">${errs.map(esc).join('<br>')}</div>` : ''}
<form class="form" method="post" action="${A}/${name}/save"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="id" value="${id || ''}">
${E.fields.map((f) => field(f, vals[f.n], f.n === 'slug' && legal)).join('\n')}
<div><button class="btn" type="submit">저장</button> <a class="btn sec" href="${A}/${name}">목록</a></div></form>
${id && !legal ? `<form method="post" action="${A}/${name}/${id}/delete" data-confirm="정말 삭제할까요? 되돌릴 수 없습니다." style="margin-top:14px"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="btn red" type="submit">삭제</button></form>` : ''}`;
  return shell(A, E.label, body, { csrf, active: '/' + name });
}

/* ---------- 라우터 ---------- */
export async function admin(req, env, ctx, url, A) {
  const method = req.method;
  const parts = url.pathname.slice(A.length).split('/').filter(Boolean);
  if (!env.ADMIN_PASSWORD || !env.ADMIN_USER || !env.SESSION_SECRET || env.SESSION_SECRET.length < 16) {
    return new Response('관리자 설정이 완료되지 않았습니다. ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET(16자 이상) 비밀값을 등록하세요.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  /* 로그인 */
  if (parts[0] === 'login') {
    const form = (err) => shell(A, '로그인', `<div class="login"><h2>관리자 로그인</h2>${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}<form class="form" method="post" action="${A}/login"><label>아이디<input type="text" name="u" autocomplete="username" required></label><label>비밀번호<input type="password" name="p" autocomplete="current-password" required></label><button class="btn" type="submit">로그인</button></form></div>`);
    if (method === 'GET') return (await readSession(env, req, url)) ? redirect(A) : form();
    if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    if (!sameOrigin(req, url)) return new Response('Forbidden', { status: 403 });
    const key = await ipKey(env, req, 'login');
    if ((await rlCount(env, key, 900)) >= 5) { const r = form('로그인 시도가 너무 많습니다. 15분 뒤에 다시 시도하세요.'); return new Response(r.body, { status: 429, headers: r.headers }); }
    const f = await req.formData();
    const [a, b] = await Promise.all([safeEqual(String(f.get('u') || ''), env.ADMIN_USER, env.SESSION_SECRET), safeEqual(String(f.get('p') || ''), env.ADMIN_PASSWORD, env.SESSION_SECRET)]);
    if (!(a && b)) {
      await rlHit(env, key);
      await new Promise((r) => setTimeout(r, 600));
      const r = form('아이디 또는 비밀번호가 올바르지 않습니다.');
      return new Response(r.body, { status: 401, headers: r.headers });
    }
    await rlClear(env, key);
    return redirect(A, { 'Set-Cookie': sessionCookie(url, await makeSession(env), 8 * 3600) });
  }

  const sess = await readSession(env, req, url);
  if (!sess) return redirect(A + '/login');
  const csrf = await csrfToken(env, sess.token);
  let form = null;
  if (method === 'POST') {
    if (!sameOrigin(req, url)) return new Response('Forbidden', { status: 403 });
    form = await req.formData();
    if (!(await safeEqual(String(form.get('_csrf') || ''), csrf, env.SESSION_SECRET))) return new Response('잘못된 요청입니다(CSRF). 새로고침 후 다시 시도하세요.', { status: 403 });
  } else if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const ok = url.searchParams.get('ok') || '';
  const [name, a2, a3] = parts;

  if (name === 'logout' && method === 'POST') return redirect(A + '/login', { 'Set-Cookie': sessionCookie(url, '', 0) });
  if (!name) return dashboard(env, A, csrf, ok);
  if (name === 'settings') return settings(env, A, csrf, form, ok);
  if (name === 'messages') return messages(env, A, csrf, form, a2, a3);

  const E = ENT[name];
  if (!E) return shell(A, '없음', '<h2>페이지를 찾을 수 없습니다</h2>', { csrf });

  if (method === 'GET') {
    if (!a2) {
      const r = await env.DB.prepare(E.list).all();
      const rows = r.results.map((x) => `<tr>${E.cols.map(([, fn]) => `<td>${fn(x)}</td>`).join('')}<td class="right"><a href="${A}/${name}/${x.id}">수정</a></td></tr>`).join('');
      return shell(A, E.label, `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h2 style="margin:0">${E.label}</h2><a class="btn" href="${A}/${name}/new">+ 새로 만들기</a></div><div style="overflow-x:auto"><table><thead><tr>${E.cols.map(([h]) => `<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${rows || `<tr><td colspan="${E.cols.length + 1}" class="muted">아직 없습니다.</td></tr>`}</tbody></table></div>`, { csrf, active: '/' + name, ok });
    }
    if (a2 === 'new') return formPage(A, name, E, E.newDefaults, 0, null, csrf, null);
    const row = await env.DB.prepare(`SELECT * FROM ${E.table} WHERE id=?`).bind(+a2 || 0).first();
    return row ? formPage(A, name, E, row, row.id, null, csrf, row) : shell(A, '없음', '<h2>찾을 수 없습니다</h2>', { csrf });
  }

  // POST
  if (a2 === 'save') {
    const id = +form.get('id') || 0;
    const row = id ? await env.DB.prepare(`SELECT * FROM ${E.table} WHERE id=?`).bind(id).first() : null;
    if (id && !row) return shell(A, '없음', '<h2>찾을 수 없습니다</h2>', { csrf });
    const vals = {}, errs = [];
    for (const f of E.fields) {
      if (f.t === 'slug') continue;
      const r = clean(f, form);
      if (r.err) errs.push(r.err); else vals[f.n] = r.v;
    }
    if (E.fields.some((f) => f.t === 'slug')) {
      if (row?.kind === 'legal') vals.slug = row.slug;
      else {
        let slug = slugify(String(form.get('slug') || '')) || slugify(vals.title || '') || 'p-' + Date.now().toString(36);
        const dup = await env.DB.prepare(`SELECT id FROM ${E.table} WHERE slug=? AND id!=?`).bind(slug, id).first();
        if (dup) slug += '-' + Math.random().toString(36).slice(2, 6);
        vals.slug = slug;
      }
    }
    if (errs.length) return formPage(A, name, E, { ...Object.fromEntries(E.fields.map((f) => [f.n, form.get(f.n)])), ...vals }, id, errs, csrf, row);
    const cols = Object.keys(vals);
    if (id) await env.DB.prepare(`UPDATE ${E.table} SET ${cols.map((c) => c + '=?').join(',')}, updated_at=unixepoch() WHERE id=?`).bind(...cols.map((c) => vals[c]), id).run();
    else {
      const all = name === 'pages' ? [...cols, 'kind'] : cols;
      await env.DB.prepare(`INSERT INTO ${E.table}(${all.join(',')}) VALUES(${all.map(() => '?').join(',')})`).bind(...cols.map((c) => vals[c]), ...(name === 'pages' ? ['notice'] : [])).run();
    }
    await bump(env);
    return redirect(`${A}/${name}?ok=saved`);
  }
  if (a3 === 'delete') {
    const id = +a2 || 0;
    if (name === 'pages') await env.DB.prepare("DELETE FROM pages WHERE id=? AND kind!='legal'").bind(id).run();
    else await env.DB.prepare(`DELETE FROM ${E.table} WHERE id=?`).bind(id).run();
    if (name === 'coupons') await env.DB.prepare('DELETE FROM clicks WHERE coupon_id=?').bind(id).run();
    await bump(env);
    return redirect(`${A}/${name}?ok=deleted`);
  }
  return new Response('Not Found', { status: 404 });
}

/* ---------- 대시보드 ---------- */
const daysAgo = (n) => new Date(Date.now() + 9 * 3600e3 - n * 864e5).toISOString().slice(0, 10);
async function dashboard(env, A, csrf, ok) {
  const d30 = daysAgo(29), d14 = daysAgo(13);
  const [byDay, topC, topS, counts] = await env.DB.batch([
    env.DB.prepare('SELECT day, COUNT(*) n FROM clicks WHERE day>=? GROUP BY day').bind(d30),
    env.DB.prepare('SELECT c.id, c.title, COUNT(*) n FROM clicks k JOIN coupons c ON c.id=k.coupon_id WHERE k.day>=? GROUP BY k.coupon_id ORDER BY n DESC LIMIT 10').bind(d30),
    env.DB.prepare("SELECT source, COUNT(*) n FROM clicks WHERE day>=? GROUP BY source ORDER BY n DESC LIMIT 10").bind(d30),
    env.DB.prepare("SELECT (SELECT COUNT(*) FROM coupons WHERE active=1 AND (expire='' OR expire>=?)) coupons, (SELECT COUNT(*) FROM posts WHERE status='published') posts, (SELECT COUNT(*) FROM pages WHERE kind='notice' AND status='published') notices, (SELECT COUNT(*) FROM messages WHERE is_read=0) unread, (SELECT COUNT(*) FROM settings WHERE key='contact_email' AND value!='') hasmail").bind(today()),
  ]);
  const m = Object.fromEntries(byDay.results.map((r) => [r.day, r.n]));
  const sum = (from) => Object.entries(m).filter(([d]) => d >= from).reduce((a, [, n]) => a + n, 0);
  const days = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i));
  const max = Math.max(1, ...days.map((d) => m[d] || 0));
  const c = counts.results[0];
  const warns = [];
  if (A === '/admin') warns.push('관리자 주소가 기본값(/admin)입니다. wrangler.jsonc의 ADMIN_PATH를 추측하기 어려운 값으로 바꾸세요.');
  if (!c.hasmail) warns.push('설정에서 문의 이메일과 운영자 이름을 입력하세요. 개인정보처리방침·소개 페이지에 표시됩니다.');
  if (!c.coupons) warns.push('노출 중인 쿠폰이 없습니다. 쿠폰 메뉴에서 제휴 링크를 등록하세요.');
  const body = `<h2>대시보드</h2>${warns.map((w) => `<div class="err" role="alert">${esc(w)}</div>`).join('')}
<div class="cards"><div class="stat"><b>${sum(daysAgo(0))}</b><span>오늘 클릭</span></div><div class="stat"><b>${sum(daysAgo(6))}</b><span>최근 7일</span></div><div class="stat"><b>${sum(d30)}</b><span>최근 30일</span></div><div class="stat"><b>${c.coupons}</b><span>노출 쿠폰</span></div><div class="stat"><b>${c.posts}</b><span>안내 글</span></div><div class="stat"><b>${c.unread}</b><span>새 문의</span></div></div>
<h3>최근 14일 클릭</h3><div class="bars" role="img" aria-label="최근 14일 일별 클릭 수">${days.map((d) => `<i title="${d}: ${m[d] || 0}" style="height:${Math.round(((m[d] || 0) / max) * 100)}%"></i>`).join('')}</div>
<h3>인기 쿠폰 (30일)</h3><table><tbody>${topC.results.map((r) => `<tr><td><a href="${A}/coupons/${r.id}">${esc(r.title)}</a></td><td class="right">${r.n}</td></tr>`).join('') || '<tr><td class="muted">아직 클릭이 없습니다.</td></tr>'}</tbody></table>
<h3>클릭이 많이 나온 페이지 (30일)</h3><table><tbody>${topS.results.map((r) => `<tr><td>${esc(r.source || '(알 수 없음)')}</td><td class="right">${r.n}</td></tr>`).join('') || '<tr><td class="muted">아직 데이터가 없습니다.</td></tr>'}</tbody></table>
<p class="muted">클릭 수는 봇을 제외한 제휴 링크 클릭입니다. 실제 예약·수익은 트립닷컴 제휴 대시보드에서 확인하세요.</p>`;
  return shell(A, '대시보드', body, { csrf, active: '', ok });
}

/* ---------- 설정 ---------- */
async function settings(env, A, csrf, form, ok) {
  const cur = Object.fromEntries((await env.DB.prepare('SELECT key,value FROM settings').all()).results.map((r) => [r.key, r.value]));
  const render = (vals, errs) => shell(A, '설정', `<h2>설정</h2>${errs?.length ? `<div class="err" role="alert">${errs.map(esc).join('<br>')}</div>` : ''}<form class="form" method="post" action="${A}/settings"><input type="hidden" name="_csrf" value="${esc(csrf)}">${SETTINGS.map((f) => field(f, vals[f.n])).join('\n')}<div><button class="btn" type="submit">저장</button></div></form>`, { csrf, active: '/settings', ok });
  if (!form) return render(cur);
  const vals = {}, errs = [];
  for (const f of SETTINGS) {
    const r = clean(f, form);
    if (r.err) errs.push(r.err); else vals[f.n] = r.v;
  }
  if (vals.cf_beacon && !/^[a-f0-9]{32}$/i.test(vals.cf_beacon)) errs.push('Cloudflare Web Analytics 토큰은 32자리 16진수여야 합니다.');
  for (const k of ['google_verify', 'naver_verify']) if (vals[k] && !/^[\w-]{8,100}$/.test(vals[k])) errs.push('인증 코드는 영문·숫자·-·_ 만 입력할 수 있습니다.');
  if (vals.extra_params && /\s/.test(vals.extra_params)) errs.push('추가 파라미터에는 공백을 넣을 수 없습니다.');
  if (vals.site_url) vals.site_url = vals.site_url.replace(/\/+$/, '');
  if (errs.length) return render({ ...cur, ...Object.fromEntries(SETTINGS.map((f) => [f.n, form.get(f.n)])) }, errs);
  await env.DB.batch(Object.entries(vals).map(([k, v]) => env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, String(v))));
  await bump(env);
  return redirect(`${A}/settings?ok=saved`);
}

/* ---------- 문의함 ---------- */
async function messages(env, A, csrf, form, id, action) {
  if (form && action === 'delete') { await env.DB.prepare('DELETE FROM messages WHERE id=?').bind(+id || 0).run(); return redirect(`${A}/messages?ok=deleted`); }
  if (id) {
    const m = await env.DB.prepare('SELECT * FROM messages WHERE id=?').bind(+id || 0).first();
    if (!m) return redirect(A + '/messages');
    await env.DB.prepare('UPDATE messages SET is_read=1 WHERE id=?').bind(m.id).run();
    return shell(A, '문의', `<h2>문의</h2><div class="form"><div><b>${esc(m.name)}</b> · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a> · <span class="muted">${fmtDate(m.created_at)}</span></div><div style="white-space:pre-wrap">${esc(m.body)}</div></div><form method="post" action="${A}/messages/${m.id}/delete" data-confirm="이 문의를 삭제할까요?" style="margin-top:14px"><input type="hidden" name="_csrf" value="${esc(csrf)}"><a class="btn sec" href="${A}/messages">목록</a> <button class="btn red">삭제</button></form>`, { csrf, active: '/messages' });
  }
  const r = await env.DB.prepare('SELECT id,name,email,is_read,created_at,substr(body,1,60) b FROM messages ORDER BY id DESC LIMIT 200').all();
  const rows = r.results.map((x) => `<tr><td>${x.is_read ? '' : '<span class="tag">새 글</span>'}</td><td><a href="${A}/messages/${x.id}">${esc(x.name)}</a></td><td>${esc(x.email)}</td><td>${esc(x.b)}</td><td>${fmtDate(x.created_at)}</td></tr>`).join('');
  return shell(A, '문의함', `<h2>문의함</h2><div style="overflow-x:auto"><table><thead><tr><th></th><th>이름</th><th>이메일</th><th>내용</th><th>날짜</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">받은 문의가 없습니다.</td></tr>'}</tbody></table></div>`, { csrf, active: '/messages', ok: new URLSearchParams('').get('ok') });
}
