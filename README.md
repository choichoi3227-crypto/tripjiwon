# 트립지원닷컴 (Cloudflare Workers + D1)

트립닷컴 제휴 쿠폰 사이트. 서버리스(Workers) + D1 데이터베이스, 관리자 화면 포함, GitHub push로 자동 배포.

## 구조
- **쿠폰 섹션**: 관리자 > 쿠폰에서 제휴 링크를 등록하면 카드로 표시 (마감일이 지나면 자동 숨김)
- **쿠폰 안내**: 관리자 > 쿠폰 안내 글 (`/guide`). 글 본문 2번째 문단 뒤와 끝에 쿠폰이 자동 삽입됨
- **공지**: 관리자 > 공지·페이지에서 새 페이지를 만들면 공지(`/notice/주소`)로 분류
- **필수 페이지(자동 준비)**: 소개, 문의하기, 개인정보처리방침, 이용약관, 제휴 광고 표시, 면책 조항

## 배포 (GitHub → Cloudflare)

1. **GitHub 저장소를 만들고 이 폴더를 push** (main 브랜치)
2. **D1 데이터베이스 생성** (한 번만)
   ```
   npm install
   npx wrangler login
   npx wrangler d1 create tripjiwon-db
   ```
   출력된 `database_id`를 `wrangler.jsonc`의 `REPLACE_WITH_YOUR_D1_DATABASE_ID` 자리에 넣고 커밋
3. **Cloudflare API 토큰 만들기**: 대시보드 > My Profile > API Tokens > "Edit Cloudflare Workers" 템플릿 + 권한에 `Account > D1 > Edit` 추가
4. **GitHub > Settings > Secrets and variables > Actions** 에 5개 등록

   | 이름 | 값 |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | 3번에서 만든 토큰 |
   | `CLOUDFLARE_ACCOUNT_ID` | 대시보드의 계정 ID |
   | `ADMIN_USER` | 관리자 아이디 |
   | `ADMIN_PASSWORD` | 12자 이상 긴 비밀번호 |
   | `SESSION_SECRET` | `openssl rand -hex 32` 로 만든 무작위 문자열 |

5. `main`에 push 하면 Actions가 **D1 마이그레이션 → 배포 → 비밀값 등록**을 자동 실행
6. **wrangler.jsonc 의 vars 수정**
   - `ADMIN_PATH`: 기본 `/admin`을 추측하기 어려운 값으로 변경 (예: `/manage-k3x9`)
   - `SITE_URL`: 정식 도메인 (예: `https://example.com`). canonical·사이트맵·구조화 데이터에 사용됨
7. **도메인 연결**: Workers & Pages > tripjiwon > Settings > Domains & Routes > Add > Custom domain. 한글 도메인(트립지원.com)은 퓨니코드(`xn--...`)로 입력하고 `SITE_URL`도 같은 주소로 맞추세요.

> 대시보드에서 직접 연결(Workers Builds)하려면 배포 명령을 `npx wrangler d1 migrations apply DB --remote && npx wrangler deploy` 로 지정하고, 비밀값 3개는 Settings > Variables and Secrets 에 등록하세요.

## 첫 설정 체크리스트
1. `{관리자 주소}/login` 접속 후 로그인
2. **설정**: 문의 이메일, 운영자 이름, 정식 도메인, 공유 이미지 입력 (개인정보처리방침·소개에 반영됨)
3. **쿠폰**: 제휴 대시보드에서 발급한 링크로 쿠폰 등록 (혜택 문구·마감일·우선순위 입력)
4. **설정 > 링크에 추가할 파라미터**: 트립닷컴 제휴 대시보드가 지원하는 하위 추적(sub id) 이름을 확인해 `이름={coupon_id}` 형태로 입력
5. **공지·페이지**의 필수 페이지 본문을 읽고 운영 실정에 맞게 수정 (법률 검토 권장)
6. 구글 서치콘솔·네이버 서치어드바이저에 `사이트 주소/sitemap.xml` 제출 (인증 코드는 설정에 입력)

## 보안 요약
- 비밀번호 비교는 고정 시간 방식, 세션은 HMAC 서명 쿠키(HttpOnly, Secure, SameSite=Strict, 8시간)
- 로그인 5회 실패 시 15분 잠금 (IP는 해시로만 보관, 24시간 후 삭제)
- 모든 관리자 POST에 CSRF 토큰 + Origin 검사
- 관리자 경로 변경 가능, 관리자 응답은 noindex·no-store
- CSP, HSTS, X-Frame-Options, Referrer-Policy 등 보안 헤더 일괄 적용
- 모든 출력 이스케이프, 본문은 안전한 마크다운 부분집합만 허용 (원시 HTML 불가)
- 클릭 로그에 IP·개인정보 저장 안 함, 봇 클릭 제외

## SEO 요약
페이지별 title·description·canonical, Open Graph, JSON-LD(WebSite, Organization, FAQPage, Article, BreadcrumbList), sitemap.xml, robots.txt, RSS, 제휴 링크 `rel="sponsored nofollow"`, `/go/` 경로 noindex

## 로컬 개발
```
cp .dev.vars.example .dev.vars   # 값 수정
npm install
npm run db:local
npm run dev
```
