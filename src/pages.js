// 공개 페이지, SEO 파일, 클릭 리다이렉트, 문의 접수
import { esc, md, mdBlocks, fill, today, fmtDate, isoDate, CATS, CAT_ICON, xmlEsc, cleanSource, sameOrigin, ipKey, rlCount, rlHit } from './lib.js';
import { SITE_CSS, SITE_JS } from './assets.js';
import { layout, grid, couponCard, crumbsHtml, dday } from './layout.js';

const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
export const ASSET_V = hash(SITE_CSS + SITE_JS);

const DEF = { site_name: '트립지원닷컴', tagline: '', hero_title: '', hero_desc: '', disclosure: '', contact_email: '', operator_name: '', default_url: '', extra_params: '', og_image: '', cf_beacon: '', google_verify: '', naver_verify: '', site_url: '', cache_v: '1' };

const ACTIVE = `active=1 AND (expire='' OR expire>=?)`;
export async function activeCoupons(env, { cat, limit = 60 } = {}) {
  const sql = `SELECT * FROM coupons WHERE ${ACTIVE}${cat ? ' AND category=?' : ''} ORDER BY priority DESC, featured DESC, id DESC LIMIT ${Math.min(+limit || 60, 200)}`;
  const r = await env.DB.prepare(sql).bind(...(cat ? [today(), cat] : [today()])).all();
  return r.results || [];
}

export async function loadSettings(env, url) {
  const [rows, legal, top] = await env.DB.batch([
    env.DB.prepare('SELECT key, value FROM settings'),
    env.DB.prepare("SELECT slug, title FROM pages WHERE kind='legal' AND status='published' ORDER BY id"),
    env.DB.prepare(`SELECT id FROM coupons WHERE ${ACTIVE} ORDER BY priority DESC, featured DESC, id DESC LIMIT 1`).bind(today()),
  ]);
  const s = { ...DEF };
  for (const r of rows.results) s[r.key] = r.value;
  s.base = (env.SITE_URL || s.site_url || url.origin).replace(/\/+$/, '');
  s.legal = legal.results.map((p) => ({ slug: p.slug, title: fill(p.title, { ...s, base: s.base }) }));
  s.top = top.results[0] || null;
  s.asset_v = ASSET_V;
  return s;
}

const html = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60, s-maxage=300' } });
const text = (body, type, extra = {}) => new Response(body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=3600', ...extra } });

const secHead = (title, sub, more) => `<div class="sec-h"><div><h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>${more ? `<a class="more" href="${more[0]}">${esc(more[1])} ›</a>` : ''}</div>`;
const postCard = (p) => `<article class="pcard"><a href="/guide/${encodeURIComponent(p.slug)}"><div class="th">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">` : ''}</div><div class="tx"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><time datetime="${isoDate(p.created_at)}">${fmtDate(p.created_at)}</time></div></a></article>`;
const noticeList = (list, s) => (list.length ? `<ul class="nlist">${list.map((p) => `<li><a href="/notice/${encodeURIComponent(p.slug)}"><span>${esc(fill(p.title, s))}</span><time datetime="${isoDate(p.created_at)}">${fmtDate(p.created_at)}</time></a></li>`).join('')}</ul>` : '<p class="empty">등록된 공지가 없습니다.</p>');

const chips = (cur, base = '/coupons') => `<div class="chips" role="group" aria-label="분류">${Object.entries(CATS).filter(([k]) => k !== 'etc').map(([k, v]) => `<a class="chip" href="${base}?c=${k}"${cur === k ? ' aria-current="true"' : ''}>${CAT_ICON[k]} ${v}</a>`).join('')}</div>`;

const FAQ = [
  ['쿠폰은 어떻게 사용하나요?', '쿠폰 카드의 버튼을 눌러 트립닷컴으로 이동한 뒤, 결제 단계에서 쿠폰이 적용되는지 확인하세요. 코드가 있는 쿠폰은 코드를 복사해 쿠폰 입력란에 붙여 넣으면 됩니다.'],
  ['사이트를 통해 이동하면 추가 비용이 드나요?', '이용자가 별도 수수료를 내지 않도록 운영합니다. 다만 최종 결제 금액은 트립닷컴 결제 화면에서 꼭 확인해 주세요.'],
  ['쿠폰이 적용되지 않아요.', '쿠폰마다 대상 상품, 최소 결제 금액, 사용 기한, 중복 사용 가능 여부 같은 조건이 있습니다. 조건을 충족했는데도 적용되지 않으면 트립닷컴 고객센터에 문의해 주세요.'],
  ['트립닷컴 공식 사이트인가요?', '아닙니다. 트립닷컴 제휴 프로그램에 참여하는 별도 안내 사이트이며, 예약과 결제, 환불은 모두 트립닷컴에서 처리됩니다.'],
];

/* ---------- 홈 ---------- */
export async function home(env, s) {
  const [coupons, posts, notices, cnt] = await Promise.all([
    activeCoupons(env, { limit: 9 }),
    env.DB.prepare("SELECT slug,title,description,image,created_at FROM posts WHERE status='published' ORDER BY created_at DESC LIMIT 6").all(),
    env.DB.prepare("SELECT slug,title,created_at FROM pages WHERE kind='notice' AND status='published' ORDER BY created_at DESC LIMIT 6").all(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM coupons WHERE ${ACTIVE}`).bind(today()).first(),
  ]);
  const body = `
<section class="hero"><svg class="path" viewBox="0 0 560 240" aria-hidden="true"><path d="M10 220C160 40 360 260 540 40" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 9" fill="none"/><circle cx="540" cy="40" r="7" fill="#ffb703"/></svg>
<div class="wrap"><p class="eyebrow">🎫 현재 진행 중인 쿠폰 ${cnt?.n || 0}개</p>
<h1>${esc(s.hero_title)}</h1><p class="lead">${esc(s.hero_desc)}</p>
<a class="btn" href="#coupons">쿠폰 보러 가기</a> <a class="btn ghost" href="/guide">쿠폰 사용 안내</a>
${chips('')}</div></section>

<section class="sec" id="coupons"><div class="wrap">${secHead('쿠폰', '우선순위가 높은 쿠폰이 먼저 보입니다.', ['/coupons', '전체 보기'])}
${coupons.length ? grid(coupons, '/') : '<p class="empty">진행 중인 쿠폰을 준비하고 있습니다. 곧 업데이트됩니다.</p>'}</div></section>

<section class="sec alt"><div class="wrap">${secHead('쿠폰, 이렇게 쓰세요')}
<ol class="steps"><li><b>쿠폰 고르기</b><span>대상 상품과 마감일을 확인하고 원하는 쿠폰을 선택하세요.</span></li><li><b>트립닷컴으로 이동</b><span>버튼을 누르면 트립닷컴 페이지가 새 창으로 열립니다. 코드는 눌러서 복사할 수 있어요.</span></li><li><b>결제 전 최종 확인</b><span>쿠폰 적용 여부와 최종 결제 금액을 결제 화면에서 꼭 확인하세요.</span></li></ol></div></section>

<section class="sec" id="guide"><div class="wrap">${secHead('쿠폰 안내', '쿠폰 사용법과 예약 팁을 정리했습니다.', ['/guide', '더 보기'])}
${posts.results.length ? `<div class="grid">${posts.results.map(postCard).join('')}</div>` : '<p class="empty">안내 글을 준비하고 있습니다.</p>'}</div></section>

<section class="sec" id="notice"><div class="wrap">${secHead('공지', '', ['/notice', '전체 보기'])}${noticeList(notices.results, s)}</div></section>

<section class="sec"><div class="wrap">${secHead('자주 묻는 질문')}
<div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>

<section class="band"><div class="wrap"><h2>예약 전에 쿠폰부터 받아 가세요</h2><p>마감된 쿠폰은 자동으로 숨겨져, 지금 쓸 수 있는 쿠폰만 보여 드립니다.</p><a class="btn" href="/coupons">전체 쿠폰 보기</a></div></section>`;
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return html(layout(s, { path: '/', desc: `${s.hero_title}. ${s.hero_desc}`, body, jsonld: [faqLd] }));
}

/* ---------- 쿠폰 ---------- */
export async function couponsPage(env, s, url) {
  const c = url.searchParams.get('c');
  const cat = CATS[c] ? c : '';
  const list = await activeCoupons(env, { cat, limit: 100 });
  const tabs = `<div class="tabs"><a class="chip" href="/coupons"${!cat ? ' aria-current="true"' : ''}>전체</a>${Object.entries(CATS).map(([k, v]) => `<a class="chip" href="/coupons?c=${k}"${cat === k ? ' aria-current="true"' : ''}>${CAT_ICON[k]} ${v}</a>`).join('')}</div>`;
  const body = `${crumbsHtml([{ name: '쿠폰' }])}<section class="sec" style="padding-top:18px"><div class="wrap"><h1 style="margin:0;font-size:clamp(26px,4.4vw,36px);letter-spacing:-.03em">트립닷컴 할인 쿠폰${cat ? ' · ' + CATS[cat] : ''}</h1>
<p class="sub">진행 중인 쿠폰 ${list.length}개 · 마감일이 지난 쿠폰은 자동으로 숨겨집니다.</p>
<p class="disc" style="margin-top:14px">${esc(s.disclosure)}</p>${tabs}
${list.length ? grid(list, '/coupons') : '<p class="empty">해당 분류에 진행 중인 쿠폰이 없습니다.</p>'}</div></section>`;
  return html(layout(s, { path: '/coupons', title: '트립닷컴 할인 쿠폰 모음', desc: '항공권·호텔·투어 등 지금 쓸 수 있는 트립닷컴 할인 쿠폰을 마감일과 함께 모았습니다.', body, crumbs: [{ name: '쿠폰', path: '/coupons' }] }));
}

/* ---------- 쿠폰 안내(글) ---------- */
export async function guideList(env, s) {
  const r = await env.DB.prepare("SELECT slug,title,description,image,created_at FROM posts WHERE status='published' ORDER BY created_at DESC LIMIT 100").all();
  const body = `${crumbsHtml([{ name: '쿠폰 안내' }])}<section class="sec" style="padding-top:18px"><div class="wrap"><h1 style="margin:0;font-size:clamp(26px,4.4vw,36px);letter-spacing:-.03em">쿠폰 안내</h1><p class="sub">쿠폰 사용법과 트립닷컴 예약 팁을 정리했습니다.</p>
${r.results.length ? `<div class="grid">${r.results.map(postCard).join('')}</div>` : '<p class="empty">아직 등록된 글이 없습니다.</p>'}</div></section>`;
  return html(layout(s, { path: '/guide', title: '쿠폰 안내', desc: '트립닷컴 쿠폰 사용법과 예약 전 확인할 팁을 정리한 안내 글 모음입니다.', body, crumbs: [{ name: '쿠폰 안내', path: '/guide' }] }));
}

export async function guidePost(env, s, slug) {
  const p = await env.DB.prepare("SELECT * FROM posts WHERE slug=? AND status='published'").bind(slug).first();
  if (!p) return null;
  const [coupons, rel] = await Promise.all([
    activeCoupons(env, { limit: 3 }),
    env.DB.prepare("SELECT slug,title,description,image,created_at FROM posts WHERE status='published' AND id!=? ORDER BY created_at DESC LIMIT 3").bind(p.id).all(),
  ]);
  const blocks = mdBlocks(fill(p.body, s));
  const path = `/guide/${encodeURIComponent(p.slug)}`;
  if (coupons.length && blocks.length > 2) blocks.splice(2, 0, `<aside class="inl"><p class="l">이 글과 함께 받아 가세요</p>${grid([coupons[0]], path)}</aside>`);
  const end = coupons.length ? `<section class="endbox"><h2>예약 전에 쿠폰부터 받으세요</h2>${grid(coupons, path)}</section>` : '';
  const relHtml = rel.results.length ? `<section class="sec"><div class="wrap">${secHead('함께 보면 좋은 글')}<div class="grid">${rel.results.map(postCard).join('')}</div></div></section>` : '';
  const body = `${crumbsHtml([{ name: '쿠폰 안내', path: '/guide' }, { name: p.title }])}
<article class="entry"><h1>${esc(p.title)}</h1><div class="meta"><time datetime="${isoDate(p.created_at)}">${fmtDate(p.created_at)}</time>${p.updated_at - p.created_at > 86400 ? ` · 수정 ${fmtDate(p.updated_at)}` : ''}</div>
<p class="disc">${esc(s.disclosure)}</p>${p.image ? `<img class="cover" src="${esc(p.image)}" alt="" decoding="async">` : ''}
<div class="body">${blocks.join('\n')}</div>${end}</article>${relHtml}`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: isoDate(p.created_at), dateModified: isoDate(p.updated_at), inLanguage: 'ko-KR', mainEntityOfPage: s.base + path, author: { '@type': 'Organization', name: s.site_name }, publisher: { '@type': 'Organization', name: s.site_name, logo: { '@type': 'ImageObject', url: s.base + '/favicon.svg' } }, ...(p.image ? { image: p.image } : {}) };
  return html(layout(s, { path, title: p.title, desc: p.description || p.body.replace(/[#*\->\[\]()]/g, ' '), image: p.image, ogType: 'article', body, jsonld: [article], crumbs: [{ name: '쿠폰 안내', path: '/guide' }, { name: p.title, path }] }));
}

/* ---------- 공지 / 필수 페이지 ---------- */
export async function noticeIndex(env, s) {
  const r = await env.DB.prepare("SELECT slug,title,created_at FROM pages WHERE kind='notice' AND status='published' ORDER BY created_at DESC LIMIT 100").all();
  const body = `${crumbsHtml([{ name: '공지' }])}<section class="sec" style="padding-top:18px"><div class="wrap"><h1 style="margin:0;font-size:clamp(26px,4.4vw,36px);letter-spacing:-.03em">공지</h1>${noticeList(r.results, s)}</div></section>`;
  return html(layout(s, { path: '/notice', title: '공지', desc: `${s.site_name}의 공지사항입니다.`, body, crumbs: [{ name: '공지', path: '/notice' }] }));
}

const entryPage = (s, p, { path, kind, extra = '' }) => {
  const title = fill(p.title, s);
  const crumbs = kind === 'notice' ? [{ name: '공지', path: '/notice' }, { name: title }] : [{ name: title }];
  const body = `${crumbsHtml(crumbs)}<article class="entry"><h1>${esc(title)}</h1>${kind === 'notice' ? `<div class="meta"><time datetime="${isoDate(p.created_at)}">${fmtDate(p.created_at)}</time></div>` : ''}<div class="body">${md(fill(p.body, s))}</div>${extra}</article>`;
  const ld = kind === 'notice' ? [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, datePublished: isoDate(p.created_at), dateModified: isoDate(p.updated_at), url: s.base + path }] : [];
  return html(layout(s, { path, title, desc: fill(p.description, s) || title, body, jsonld: ld, crumbs: crumbs.map((c) => ({ name: c.name, path: c.path || path })) }));
};

export async function noticePage(env, s, slug) {
  const p = await env.DB.prepare("SELECT * FROM pages WHERE slug=? AND kind='notice' AND status='published'").bind(slug).first();
  return p ? entryPage(s, p, { path: `/notice/${encodeURIComponent(p.slug)}`, kind: 'notice' }) : null;
}

export async function legalPage(env, s, slug, url) {
  const p = await env.DB.prepare("SELECT * FROM pages WHERE slug=? AND kind='legal' AND status='published'").bind(slug).first();
  if (!p) return null;
  let extra = '';
  if (slug === 'contact') {
    const st = url.searchParams.get('sent');
    extra = `${st === '1' ? '<p class="msg ok" role="status">문의가 접수되었습니다. 확인 후 답변드리겠습니다.</p>' : ''}${st === 'err' ? '<p class="msg err" role="alert">입력 내용을 확인해 주세요. (이름, 올바른 이메일, 5자 이상의 내용)</p>' : ''}${st === 'wait' ? '<p class="msg err" role="alert">요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.</p>' : ''}
<form class="form" method="post" action="/contact"><label>이름<input name="name" maxlength="50" required autocomplete="name"></label>
<label>이메일<input name="email" type="email" maxlength="120" required autocomplete="email"></label>
<label>문의 내용<textarea name="body" maxlength="2000" minlength="5" required></textarea></label>
<div class="hp" aria-hidden="true"><label>웹사이트<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p class="sub" style="margin:0">제출하면 <a href="/privacy">개인정보처리방침</a>에 따라 문의 처리에 필요한 정보만 사용됩니다.</p>
<button class="btn blue" type="submit">보내기</button></form>`;
  }
  return entryPage(s, p, { path: '/' + encodeURIComponent(p.slug), kind: 'legal', extra });
}

export async function contactPost(req, env, url) {
  const back = (q) => new Response(null, { status: 303, headers: { Location: '/contact?sent=' + q } });
  if (!sameOrigin(req, url)) return new Response('Forbidden', { status: 403 });
  const f = await req.formData();
  if (String(f.get('website') || '').trim()) return back('1'); // 봇: 조용히 성공 처리
  const name = String(f.get('name') || '').trim().slice(0, 50), email = String(f.get('email') || '').trim().slice(0, 120), body = String(f.get('body') || '').trim().slice(0, 2000);
  if (!name || body.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back('err');
  const key = await ipKey(env, req, 'contact');
  if ((await rlCount(env, key, 3600)) >= 3) return back('wait');
  await rlHit(env, key);
  await env.DB.prepare('INSERT INTO messages(name,email,body) VALUES(?,?,?)').bind(name, email, body).run();
  return back('1');
}

/* ---------- 클릭 리다이렉트 ---------- */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|bingpreview|headless|lighthouse|monitor|curl|wget|python-requests/i;
export async function go(req, env, ctx, url, id) {
  const [c, set] = await Promise.all([
    env.DB.prepare('SELECT * FROM coupons WHERE id=? AND active=1').bind(id).first(),
    env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('default_url','extra_params')").all(),
  ]);
  const st = Object.fromEntries(set.results.map((r) => [r.key, r.value]));
  const src = cleanSource(url.searchParams.get('s'));
  let target = c?.url || st.default_url || '';
  try {
    const u = new URL(target);
    if (!/^https?:$/.test(u.protocol)) throw 0;
    const x = (st.extra_params || '').replace('{coupon_id}', String(id)).replace('{source}', src.replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_|_$/g, '').slice(0, 40) || 'home').replace(/^[?&]+/, '');
    if (x) for (const [k, v] of new URLSearchParams(x)) u.searchParams.set(k, v);
    target = u.toString();
  } catch { target = ''; }
  const dest = target || '/coupons';
  if (c && target && !BOT.test(req.headers.get('User-Agent') || 'bot')) {
    ctx.waitUntil((async () => {
      await env.DB.prepare('INSERT INTO clicks(coupon_id,source,day) VALUES(?,?,?)').bind(id, src, today()).run();
      if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM clicks WHERE created_at<?').bind(Math.floor(Date.now() / 1000) - 400 * 86400).run();
    })());
  }
  return new Response(null, { status: 302, headers: { Location: dest, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer-when-downgrade' } });
}

/* ---------- SEO 파일 ---------- */
export function robots(s) {
  return text(`User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /api/\n\nSitemap: ${s.base}/sitemap.xml\n`, 'text/plain; charset=utf-8');
}
export async function sitemap(env, s) {
  const [posts, pages] = await env.DB.batch([
    env.DB.prepare("SELECT slug, updated_at FROM posts WHERE status='published' ORDER BY id"),
    env.DB.prepare("SELECT slug, kind, updated_at FROM pages WHERE status='published' ORDER BY id"),
  ]);
  const u = (loc, ts, pr) => `<url><loc>${xmlEsc(s.base + loc)}</loc>${ts ? `<lastmod>${isoDate(ts).slice(0, 10)}</lastmod>` : ''}<priority>${pr}</priority></url>`;
  const now = Math.floor(Date.now() / 1000);
  const items = [u('/', now, '1.0'), u('/coupons', now, '0.9'), u('/guide', now, '0.8'), u('/notice', now, '0.5'),
    ...posts.results.map((p) => u('/guide/' + encodeURIComponent(p.slug), p.updated_at, '0.7')),
    ...pages.results.map((p) => u((p.kind === 'notice' ? '/notice/' : '/') + encodeURIComponent(p.slug), p.updated_at, p.kind === 'notice' ? '0.4' : '0.3'))];
  return text(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>`, 'application/xml; charset=utf-8');
}
export async function rss(env, s) {
  const r = await env.DB.prepare("SELECT slug,title,description,created_at FROM posts WHERE status='published' ORDER BY created_at DESC LIMIT 20").all();
  const items = r.results.map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${xmlEsc(s.base + '/guide/' + encodeURIComponent(p.slug))}</link><guid>${xmlEsc(s.base + '/guide/' + encodeURIComponent(p.slug))}</guid><pubDate>${new Date(p.created_at * 1000).toUTCString()}</pubDate><description>${xmlEsc(p.description)}</description></item>`).join('');
  return text(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEsc(s.site_name)}</title><link>${xmlEsc(s.base)}/</link><description>${xmlEsc(s.tagline)}</description><language>ko</language>${items}</channel></rss>`, 'application/rss+xml; charset=utf-8');
}
export function securityTxt(s) {
  return text(`Contact: ${s.contact_email ? 'mailto:' + s.contact_email : s.base + '/contact'}\nPreferred-Languages: ko, en\nCanonical: ${s.base}/.well-known/security.txt\n`, 'text/plain; charset=utf-8');
}

export async function notFound(env, s) {
  const list = await activeCoupons(env, { limit: 3 });
  const body = `<section class="entry"><h1>페이지를 찾을 수 없습니다</h1><div class="body"><p>주소가 바뀌었거나 삭제된 페이지입니다. 지금 진행 중인 쿠폰은 아래에서 확인하세요.</p></div>${grid(list, '/404')}<p><a class="btn blue" href="/">홈으로</a></p></section>`;
  return html(layout(s, { path: '/404', title: '페이지를 찾을 수 없습니다', body, noindex: true }), 404);
}
