-- 트립지원닷컴 초기 스키마
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');

CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'etc',
  description TEXT NOT NULL DEFAULT '',
  expire TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_coupons_active ON coupons(active, priority DESC);

-- 쿠폰 안내 (글)
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_posts_status ON posts(status, created_at DESC);

-- 페이지: kind='notice' 는 공지 섹션, kind='legal' 은 필수 페이지(푸터)
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'notice',
  status TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_pages_kind ON pages(kind, status, created_at DESC);

-- 제휴 링크 클릭 (IP는 저장하지 않음)
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_clicks_day ON clicks(day);
CREATE INDEX idx_clicks_coupon ON clicks(coupon_id);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 로그인·문의 속도 제한 (해시된 키만 저장, 하루 지나면 삭제)
CREATE TABLE rate_limits (key TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX idx_rl ON rate_limits(key, ts);

INSERT INTO settings(key, value) VALUES
 ('site_name', '트립지원닷컴'),
 ('tagline', '트립닷컴 할인 쿠폰 · 예약 팁 모음'),
 ('hero_title', '트립닷컴 예약 전, 쿠폰부터 확인하세요'),
 ('hero_desc', '항공권·호텔·투어 할인 쿠폰과 사용 안내를 한곳에 모았습니다. 마감일이 지난 쿠폰은 자동으로 숨겨집니다.'),
 ('disclosure', '이 사이트는 트립닷컴(Trip.com) 제휴 프로그램에 참여하고 있으며, 링크를 통해 예약하시면 운영자가 제휴사로부터 일정 수수료를 받을 수 있습니다. 이용자에게 추가 비용은 부과되지 않습니다.'),
 ('cache_v', '1');
