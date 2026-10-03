export const SITE_CSS = `
:root{--blue:#287dfa;--blue-d:#1b5fd1;--navy:#0b1f3a;--sky:#eaf3ff;--bg:#f4f8ff;--ink:#14233a;--sub:#5b6b82;--line:#dbe5f2;--cta:#d9480f;--cta-d:#bf3f0c;--gold:#ffb703;--r:14px}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:76px}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.75 Pretendard,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;word-break:keep-all;-webkit-text-size-adjust:100%}
a{color:var(--blue-d)}img{max-width:100%;height:auto}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.skip{position:absolute;left:-999px;top:0;background:#fff;padding:10px 14px;z-index:100}.skip:focus{left:8px;top:8px}
:focus-visible{outline:3px solid var(--blue);outline-offset:2px}
.topbar{background:var(--navy);color:#cfe0ff;font-size:13px;text-align:center;padding:7px 12px}
.topbar a{color:#fff}
.head{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:60}
.head .wrap{display:flex;align-items:center;gap:20px;min-height:64px}
.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:20px;color:var(--navy);text-decoration:none;letter-spacing:-.02em}
.logo svg{flex:0 0 auto}
.logo b{color:var(--blue)}
.nav{margin-left:auto;display:flex;align-items:center;gap:6px}
.nav a{color:var(--ink);text-decoration:none;font-weight:600;font-size:15px;padding:8px 12px;border-radius:8px}
.nav a:hover,.nav a[aria-current]{background:var(--sky);color:var(--blue-d)}
.nav .cta{background:var(--cta);color:#fff;margin-left:6px}.nav .cta:hover{background:var(--cta-d);color:#fff}
@media(max-width:760px){.head .wrap{flex-wrap:wrap;gap:4px 12px;padding-top:8px;padding-bottom:6px}.nav{margin-left:0;width:100%;overflow-x:auto;padding-bottom:4px}.nav a{white-space:nowrap;padding:6px 10px;font-size:14px}.nav .cta{display:none}}
.hero{position:relative;overflow:hidden;color:#fff;background:linear-gradient(135deg,#287dfa 0%,#1359d6 52%,#0b1f3a 100%);padding:64px 0 72px}
.hero:before{content:"";position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.18),transparent 70%)}
.hero svg.path{position:absolute;right:0;bottom:0;width:min(560px,70%);opacity:.5;pointer-events:none}
.hero .wrap{position:relative}
.eyebrow{display:inline-flex;gap:8px;align-items:center;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:5px 14px;font-size:13px;font-weight:600;margin:0 0 16px}
.hero h1{margin:0 0 14px;font-size:clamp(30px,5.6vw,50px);line-height:1.2;font-weight:800;letter-spacing:-.03em;max-width:15em}
.hero p.lead{margin:0 0 26px;max-width:36em;color:#d6e6ff;font-size:17px}
.btn{display:inline-block;font:700 16px/1 inherit;font-family:inherit;color:#fff!important;background:var(--cta);padding:15px 26px;border-radius:10px;text-decoration:none!important;border:0;cursor:pointer}
.btn:hover{background:var(--cta-d)}
.btn.ghost{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.4)}.btn.ghost:hover{background:rgba(255,255,255,.25)}
.btn.blue{background:var(--blue)}.btn.blue:hover{background:var(--blue-d)}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.chip{display:inline-flex;gap:6px;align-items:center;background:#fff;color:var(--navy);font-weight:700;font-size:14px;padding:9px 16px;border-radius:99px;text-decoration:none;border:1px solid transparent}
.chip:hover,.chip[aria-current]{border-color:var(--blue);color:var(--blue-d)}
.hero .chip{background:rgba(255,255,255,.95)}
.sec{padding:56px 0 8px}.sec.alt{background:#fff;margin-top:48px;padding-bottom:56px;border-block:1px solid var(--line)}
.sec-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.sec h2{margin:0;font-size:clamp(22px,3.4vw,28px);letter-spacing:-.02em;line-height:1.3}
.sec .more{font-weight:700;font-size:14px;text-decoration:none}
.sub{margin:4px 0 0;color:var(--sub);font-size:15px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px}
@media(max-width:940px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.cc{position:relative;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;transition:box-shadow .2s,transform .2s}
.cc:hover{box-shadow:0 10px 28px rgba(19,89,214,.14);transform:translateY(-2px)}
.cc.feat{border:2px solid var(--blue)}
.cc-img{display:block;aspect-ratio:16/9;background:linear-gradient(135deg,#dcebff,#b9d6ff);position:relative;color:var(--blue-d);text-decoration:none}
.cc-img img{width:100%;height:100%;object-fit:cover;display:block}
.cc-ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:800;font-size:15px}
.cc-ph span{font-size:38px;line-height:1}
.ribbon{position:absolute;top:12px;left:12px;z-index:2;font-size:12px;font-weight:800;color:#1c1500;background:var(--gold);border-radius:99px;padding:3px 11px}
.cat{position:absolute;top:12px;right:12px;z-index:2;font-size:12px;font-weight:700;color:var(--navy);background:rgba(255,255,255,.92);border-radius:99px;padding:3px 10px}
.cc-b{padding:16px 18px 14px;flex:1}
.badge{margin:0 0 6px;font-size:23px;font-weight:800;color:var(--cta);line-height:1.25;letter-spacing:-.02em;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.dday{font-size:12px;font-weight:700;color:#fff;background:var(--cta);border-radius:99px;padding:2px 9px;letter-spacing:0}
.until{font-size:12px;font-weight:600;color:var(--sub);letter-spacing:0}
.cc h3{margin:0 0 6px;font-size:16px;line-height:1.45}
.cc p.d{margin:0;font-size:14px;line-height:1.6;color:var(--sub)}
.stub{position:relative;display:flex;gap:10px;align-items:center;padding:14px 18px;border-top:2px dashed #c3d3e8}
.stub:before,.stub:after{content:"";position:absolute;top:-11px;width:20px;height:20px;border-radius:50%;background:var(--bg);border:1px solid var(--line)}
.sec.alt .stub:before,.sec.alt .stub:after{background:#fff}
.stub:before{left:-11px}.stub:after{right:-11px}
.code{flex:0 0 auto;font:700 14px/1 ui-monospace,Menlo,monospace;letter-spacing:.04em;color:var(--navy);background:var(--sky);border:1px dashed #6d90c7;border-radius:8px;padding:12px;cursor:pointer}
.code:hover{background:#dcebff}
.go{flex:1;text-align:center;font-weight:700;font-size:15px;color:#fff!important;background:var(--cta);border-radius:8px;padding:12px 14px;text-decoration:none!important}
.go:hover{background:var(--cta-d)}
.empty{margin-top:20px;padding:28px;background:#fff;border:1px dashed var(--line);border-radius:var(--r);color:var(--sub);text-align:center}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px;counter-reset:s;padding:0;list-style:none}
@media(max-width:760px){.steps{grid-template-columns:1fr}}
.steps li{counter-increment:s;background:var(--bg);border-radius:var(--r);padding:20px 20px 18px;position:relative}
.steps li:before{content:counter(s);display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--blue);color:#fff;font-weight:800;margin-bottom:10px}
.steps b{display:block;margin-bottom:2px}.steps span{font-size:14px;color:var(--sub);line-height:1.6;display:block}
.pcard{background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.pcard a{display:block;color:inherit;text-decoration:none;height:100%}.pcard a:hover h3{color:var(--blue-d)}
.pcard .th{aspect-ratio:16/9;background:linear-gradient(135deg,#dcebff,#b9d6ff)}.pcard .th img{width:100%;height:100%;object-fit:cover;display:block}
.pcard .tx{padding:16px 18px 18px}.pcard h3{margin:0 0 6px;font-size:17px;line-height:1.45}
.pcard p{margin:0;font-size:14px;color:var(--sub);line-height:1.6}
.pcard time{display:block;margin-top:10px;font-size:12px;color:var(--sub)}
.nlist{list-style:none;margin:20px 0 0;padding:0;background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.nlist li+li{border-top:1px solid var(--line)}
.nlist a{display:flex;justify-content:space-between;gap:12px;padding:15px 20px;color:var(--ink);text-decoration:none}
.nlist a:hover{background:var(--sky)}.nlist time{color:var(--sub);font-size:13px;flex:0 0 auto}
.faq{margin-top:20px;display:grid;gap:10px}
.faq details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 18px}
.faq summary{cursor:pointer;font-weight:700;padding:15px 0;list-style:none;display:flex;justify-content:space-between;gap:12px}
.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:"+";color:var(--blue);font-size:20px;line-height:1}
.faq details[open] summary:after{content:"–"}.faq details p{margin:0 0 16px;color:var(--sub);font-size:15px}
.band{margin:56px 0 0;background:linear-gradient(135deg,#1359d6,#0b1f3a);color:#fff;padding:44px 0;text-align:center}
.band h2{margin:0 0 8px;font-size:26px;letter-spacing:-.02em}.band p{margin:0 0 20px;color:#cfe0ff}
.crumbs{font-size:13px;color:var(--sub);padding:18px 0 0}.crumbs a{color:var(--sub)}
.entry{max-width:760px;margin:0 auto;padding:22px 20px 24px}
.entry h1{font-size:clamp(26px,4.6vw,38px);line-height:1.3;margin:6px 0 10px;letter-spacing:-.03em}
.entry .meta{color:var(--sub);font-size:14px;margin-bottom:22px}
.entry .cover{border-radius:var(--r);margin:0 0 24px;width:100%}
.body{font-size:17px;line-height:1.9}.body h2{margin:2em 0 .5em;font-size:24px;letter-spacing:-.02em}.body h3{margin:1.6em 0 .4em;font-size:19px}
.body p{margin:0 0 1.1em}.body li{margin:.3em 0}.body blockquote{margin:1.2em 0;padding:4px 18px;border-left:4px solid var(--blue);background:var(--sky);border-radius:0 8px 8px 0}
.body hr{border:0;border-top:1px solid var(--line);margin:2em 0}.body img{border-radius:10px}
.disc{font-size:13px;color:var(--sub);background:var(--sky);border-radius:10px;padding:10px 14px;margin:0 0 22px}
.inl{margin:28px 0;padding:6px 14px 4px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:12px}
.inl .l{margin:8px 0 0;font-size:13px;font-weight:700;color:var(--blue-d)}.inl .grid{grid-template-columns:1fr;margin:10px 0}
.endbox{margin-top:40px;padding-top:6px;border-top:1px solid var(--line)}.endbox h2{font-size:22px;margin:22px 0 0}
.form{display:grid;gap:14px;margin-top:22px}.form label{font-weight:700;font-size:14px;display:grid;gap:6px}
.form input,.form textarea{font:inherit;padding:12px 14px;border:1px solid #b9c8dc;border-radius:10px;background:#fff;width:100%}
.form textarea{min-height:150px;resize:vertical}.hp{position:absolute;left:-9999px;height:0;overflow:hidden}
.msg{padding:12px 16px;border-radius:10px;margin-top:16px;font-weight:600}.msg.ok{background:#e6f7ee;color:#0b6b3a}.msg.err{background:#fdeceb;color:#a3261c}
.foot{margin-top:72px;background:var(--navy);color:#b7c8e4;font-size:14px}
.foot .wrap{padding-top:40px;padding-bottom:28px}
.fcols{display:grid;grid-template-columns:2fr 1fr 1fr;gap:28px}@media(max-width:760px){.fcols{grid-template-columns:1fr}}
.foot h4{color:#fff;margin:0 0 10px;font-size:15px}.foot ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.foot a{color:#b7c8e4;text-decoration:none}.foot a:hover{color:#fff;text-decoration:underline}
.foot .notice{margin-top:24px;padding-top:18px;border-top:1px solid #20395f;font-size:13px;line-height:1.7;color:#93a9cc}
.sticky{display:none}
@media(max-width:768px){body{padding-bottom:60px}
.sticky{display:flex;align-items:stretch;position:fixed;left:0;right:0;bottom:0;z-index:90;background:var(--cta);transform:translateY(110%);transition:transform .25s}
.sticky.on{transform:none}.sticky[hidden]{display:none}
.sticky a{flex:1;text-align:center;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:15px 8px 15px 16px;padding-bottom:calc(15px + env(safe-area-inset-bottom,0px))}
.sticky button{flex:0 0 48px;border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer;padding-bottom:env(safe-area-inset-bottom,0px)}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
`;

export const SITE_JS = `(function(){
document.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(!b)return;var c=b.getAttribute('data-copy'),o=b.textContent;function ok(){b.textContent='복사됨';setTimeout(function(){b.textContent=o},1500)}
if(navigator.clipboard){navigator.clipboard.writeText(c).then(ok,function(){})}else{var t=document.createElement('textarea');t.value=c;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(x){}t.remove()}});
document.addEventListener('submit',function(e){var m=e.target.getAttribute('data-confirm');if(m&&!confirm(m))e.preventDefault()});
var s=document.getElementById('sticky');if(s){var k='ts_x';try{if(sessionStorage.getItem(k)){s.remove();return}}catch(x){}
s.hidden=false;var t=function(){s.classList.toggle('on',window.scrollY>320)};addEventListener('scroll',t,{passive:true});t();
s.querySelector('button').addEventListener('click',function(){s.remove();try{sessionStorage.setItem(k,'1')}catch(x){}})}
})();`;

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#287dfa"/><path d="M14 36l36-16-10 28-8-10-8 6 2-10z" fill="#fff"/></svg>`;

export const ADMIN_CSS = `
:root{--blue:#287dfa;--navy:#0b1f3a;--line:#dbe5f2;--ink:#14233a;--sub:#5b6b82}
*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:var(--ink);font:15px/1.6 Pretendard,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}
a{color:#1b5fd1}.shell{display:grid;grid-template-columns:210px 1fr;min-height:100vh}@media(max-width:800px){.shell{grid-template-columns:1fr}}
.side{background:var(--navy);color:#cfe0ff;padding:20px 14px}.side h1{font-size:17px;color:#fff;margin:0 0 18px;padding:0 8px}
.side a{display:block;color:#cfe0ff;text-decoration:none;padding:9px 10px;border-radius:8px;font-weight:600}.side a:hover,.side a.on{background:#183760;color:#fff}
.side form{margin-top:18px}.main{padding:26px 28px;max-width:1000px;width:100%}h2{margin:0 0 16px;font-size:22px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:22px}
.stat{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px}.stat b{display:block;font-size:26px;line-height:1.2}.stat span{color:var(--sub);font-size:13px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:22px}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}th{background:#eef3fa;font-size:13px;color:var(--sub)}
tr:last-child td{border-bottom:0}.right{text-align:right}.muted{color:var(--sub)}
.btn{display:inline-block;background:var(--blue);color:#fff!important;border:0;border-radius:8px;padding:9px 16px;font:600 14px inherit;font-family:inherit;text-decoration:none;cursor:pointer}
.btn.sec{background:#fff;color:var(--ink)!important;border:1px solid #b9c8dc}.btn.red{background:#c62828}
.form{display:grid;gap:14px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px}
.form label{display:grid;gap:5px;font-weight:600;font-size:14px}.form label.ck{display:flex;gap:8px;align-items:center}
.form input[type=text],.form input[type=url],.form input[type=date],.form input[type=number],.form input[type=password],.form input[type=email],.form select,.form textarea{font:inherit;padding:10px 12px;border:1px solid #b9c8dc;border-radius:8px;width:100%;background:#fff}
.form textarea{min-height:110px}.form textarea.big{min-height:380px;font-family:ui-monospace,Menlo,monospace;font-size:14px}.hint{font-weight:400;color:var(--sub);font-size:12px}
.err{background:#fdeceb;color:#a3261c;border-radius:8px;padding:10px 14px;margin-bottom:14px}.ok{background:#e6f7ee;color:#0b6b3a;border-radius:8px;padding:10px 14px;margin-bottom:14px}
.login{max-width:380px;margin:12vh auto;padding:0 20px}.login .form{margin-top:14px}
.bars{display:flex;align-items:flex-end;gap:6px;height:110px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px 8px;margin-bottom:22px}
.bars i{flex:1;background:var(--blue);border-radius:4px 4px 0 0;min-height:2px}
.tag{display:inline-block;font-size:12px;font-weight:700;border-radius:99px;padding:2px 9px;background:#e6f7ee;color:#0b6b3a}.tag.off{background:#eef0f3;color:#5b6b82}
`;
