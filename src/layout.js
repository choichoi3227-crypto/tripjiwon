// 공통 레이아웃, SEO 메타, 쿠폰 카드
import { esc, CATS, CAT_ICON, today } from './lib.js';

export const LOGO = `<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#287dfa"/><path d="M14 36l36-16-10 28-8-10-8 6 2-10z" fill="#fff"/></svg>`;

const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

export function dday(expire) {
  if (!expire) return null;
  return Math.ceil((Date.parse(expire + 'T23:59:59+09:00') - Date.now()) / 864e5);
}

export function couponCard(c, src = '/') {
  const href = `/go/${c.id}?s=${encodeURIComponent(src)}`;
  const d = dday(c.expire);
  const left = d === null ? '' : d <= 7 ? `<span class="dday">${d <= 1 ? '오늘 마감' : 'D-' + d}</span>` : `<span class="until">~${esc(c.expire.slice(5).replace('-', '/'))}</span>`;
  const label = `${c.title} (새 창)`;
  const img = c.image
    ? `<img src="${esc(c.image)}" alt="" loading="lazy" decoding="async">`
    : `<div class="cc-ph"><span>${CAT_ICON[c.category] || '🧳'}</span>${esc(CATS[c.category] || '')}</div>`;
  return `<article class="cc${c.featured ? ' feat' : ''}">
<a class="cc-img" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener" aria-label="${esc(label)}" tabindex="-1">${c.featured ? '<span class="ribbon">추천</span>' : ''}<span class="cat">${esc(CATS[c.category] || '')}</span>${img}</a>
<div class="cc-b">${c.badge || left ? `<p class="badge">${esc(c.badge)}${left}</p>` : ''}<h3>${esc(c.title)}</h3>${c.description ? `<p class="d">${esc(c.description)}</p>` : ''}</div>
<div class="stub">${c.code ? `<button type="button" class="code" data-copy="${esc(c.code)}" title="눌러서 코드 복사">${esc(c.code)}</button>` : ''}<a class="go" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener" aria-label="${esc('쿠폰 받고 예약하기 - ' + label)}">쿠폰 받고 예약하기</a></div>
</article>`;
}
export const grid = (list, src) => (list.length ? `<div class="grid">${list.map((c) => couponCard(c, src)).join('')}</div>` : '');

export function layout(s, o) {
  const site = s.site_name;
  const title = o.title ? `${o.title} | ${site}` : `${site} - ${s.tagline}`;
  const desc = (o.desc || s.tagline).replace(/\s+/g, ' ').slice(0, 155);
  const canon = s.base + (o.path === '/' ? '/' : o.path);
  const img = o.image || s.og_image;
  const robots = o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const ld = [];
  if (o.path === '/') {
    ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: site, url: s.base + '/', inLanguage: 'ko-KR', description: s.tagline });
    ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: site, url: s.base + '/', logo: s.base + '/favicon.svg', ...(s.contact_email ? { email: s.contact_email } : {}) });
  }
  if (o.crumbs?.length) {
    ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: '홈', path: '/' }, ...o.crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: s.base + c.path })) });
  }
  for (const j of o.jsonld || []) ld.push(j);

  const nav = [['/coupons', '쿠폰'], ['/guide', '쿠폰 안내'], ['/notice', '공지'], ['/contact', '문의']]
    .map(([h, t]) => `<a href="${h}"${o.path === h || o.path.startsWith(h + '/') ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const legal = (s.legal || []).map((p) => `<li><a href="/${esc(p.slug)}">${esc(p.title)}</a></li>`).join('');
  const stickyHref = s.top ? `/go/${s.top.id}?s=${encodeURIComponent(o.path)}` : '';

  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canon)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#287dfa">
${s.google_verify ? `<meta name="google-site-verification" content="${esc(s.google_verify)}">` : ''}
${s.naver_verify ? `<meta name="naver-site-verification" content="${esc(s.naver_verify)}">` : ''}
<meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="${esc(site)}">
<meta property="og:type" content="${o.ogType || 'website'}"><meta property="og:title" content="${esc(o.title || site)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canon)}">
${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site)}" href="/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/assets/site.css?v=${s.asset_v}">
${ld.map(jsonld).join('\n')}
</head><body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<div class="topbar">트립닷컴 <b>제휴 파트너</b> 사이트입니다 · 공식 사이트가 아니며 링크를 통해 예약 시 수수료를 받을 수 있습니다 · <a href="/affiliate-disclosure">자세히</a></div>
<header class="head"><div class="wrap">
<a class="logo" href="/">${LOGO}<span>트립지원<b>닷컴</b></span></a>
<nav class="nav" aria-label="주요 메뉴">${nav}<a class="cta" href="/coupons">쿠폰 받기</a></nav>
</div></header>
<main id="main">
${o.body}
</main>
<footer class="foot"><div class="wrap">
<div class="fcols">
<div><h4>${esc(site)}</h4><p style="margin:0">${esc(s.tagline)}. 항공권·호텔·투어 예약 전에 확인할 쿠폰과 팁을 정리합니다.</p></div>
<div><h4>바로가기</h4><ul><li><a href="/coupons">쿠폰</a></li><li><a href="/guide">쿠폰 안내</a></li><li><a href="/notice">공지</a></li><li><a href="/rss.xml">RSS</a></li></ul></div>
<div><h4>정책</h4><ul>${legal}</ul></div>
</div>
<p class="notice">${esc(s.disclosure)}<br>${esc(site)}은 트립닷컴(Trip.com)의 공식 사이트가 아니며, 상표와 서비스에 대한 권리는 각 권리자에게 있습니다. 쿠폰 조건과 최종 금액은 트립닷컴 결제 화면을 기준으로 합니다.<br>© ${new Date(Date.now() + 9 * 3600e3).getUTCFullYear()} ${esc(site)}. All rights reserved.</p>
</div></footer>
${stickyHref ? `<div class="sticky" id="sticky" hidden><a href="${esc(stickyHref)}" target="_blank" rel="sponsored nofollow noopener">지금 받을 수 있는 트립닷컴 쿠폰 보기</a><button type="button" aria-label="닫기">×</button></div>` : ''}
<script src="/assets/app.js?v=${s.asset_v}" defer></script>
${s.cf_beacon ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(s.cf_beacon)}"}'></script>` : ''}
</body></html>`;
}

export function crumbsHtml(items) {
  return `<nav class="crumbs wrap" aria-label="현재 위치"><a href="/">홈</a>${items.map((c) => ` › ${c.path ? `<a href="${esc(c.path)}">${esc(c.name)}</a>` : esc(c.name)}`).join('')}</nav>`;
}
