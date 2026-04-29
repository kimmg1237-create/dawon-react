-- ============================================
-- 다원출판사 웹 플랫폼 — Supabase 스키마
-- ============================================

-- 홈페이지
CREATE TABLE home_page (
  id int PRIMARY KEY DEFAULT 1,
  hero_title text NOT NULL DEFAULT '다원출판사',
  hero_intro text NOT NULL DEFAULT ''
);
INSERT INTO home_page (id) VALUES (1);

CREATE TABLE home_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE home_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

-- 프로필
CREATE TABLE profile_page (
  id int PRIMARY KEY DEFAULT 1,
  name text NOT NULL DEFAULT '다원작가',
  role text NOT NULL DEFAULT '작가 / 출판인',
  photo text NOT NULL DEFAULT '',
  short_intro text NOT NULL DEFAULT '',
  long_intro text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  media_youtube text NOT NULL DEFAULT '',
  media_blog text NOT NULL DEFAULT '',
  media_instagram text NOT NULL DEFAULT '',
  content_areas jsonb NOT NULL DEFAULT '[]',
  history text[] NOT NULL DEFAULT '{}',
  published_books text[] NOT NULL DEFAULT '{}',
  awards text[] NOT NULL DEFAULT '{}'
);
INSERT INTO profile_page (id) VALUES (1);

-- 전자책
CREATE TABLE ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cover_url text NOT NULL DEFAULT '',
  pdf_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

-- 오디오북
CREATE TABLE audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hwp_filename text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  text_cache text,
  paragraphs_cache jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 스토어
CREATE TABLE store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price int NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  kyobo_url text NOT NULL DEFAULT '',
  yes24_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

-- 게시판
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'free' CHECK (type IN ('notice', 'free')),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  author_uid uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  author_uid uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 비공개 문의
CREATE TABLE private_board (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT '일반',
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  author_uid uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'answered')),
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 자신과의 소통
CREATE TABLE self_communication_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  author_uid uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE self_communication_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES self_communication_posts(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  author_uid uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE home_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_communication_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_communication_comments ENABLE ROW LEVEL SECURITY;

-- 헬퍼: 관리자 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() ->> 'email') = 'kimmg1237@gmail.com';
$$ LANGUAGE sql SECURITY DEFINER;

-- 공개 읽기 + 관리자 쓰기 테이블들
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['home_page','home_banners','home_books','profile_page','ebooks','audiobooks','store_products']
  LOOP
    EXECUTE format('CREATE POLICY "public_read" ON %I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "admin_write" ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())', t);
  END LOOP;
END $$;

-- posts: 공개 읽기, 인증 사용자 쓰기 (본인 글만 수정/삭제)
CREATE POLICY "public_read" ON posts FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_uid);
CREATE POLICY "own_or_admin_update" ON posts FOR UPDATE USING (auth.uid() = author_uid OR is_admin());
CREATE POLICY "own_or_admin_delete" ON posts FOR DELETE USING (auth.uid() = author_uid OR is_admin());

-- post_replies: 공개 읽기, 관리자만 작성
CREATE POLICY "public_read" ON post_replies FOR SELECT USING (true);
CREATE POLICY "admin_insert" ON post_replies FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_manage" ON post_replies FOR ALL USING (is_admin());

-- private_board: 본인+관리자 읽기, 인증 사용자 작성
CREATE POLICY "own_or_admin_read" ON private_board FOR SELECT USING (auth.uid() = author_uid OR is_admin());
CREATE POLICY "auth_insert" ON private_board FOR INSERT WITH CHECK (auth.uid() = author_uid);
CREATE POLICY "admin_update" ON private_board FOR UPDATE USING (is_admin());

-- self_communication_posts: 공개 읽기, 관리자만 작성
CREATE POLICY "public_read" ON self_communication_posts FOR SELECT USING (true);
CREATE POLICY "admin_insert" ON self_communication_posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_manage" ON self_communication_posts FOR ALL USING (is_admin());

-- self_communication_comments: 공개 읽기, 인증 사용자 작성
CREATE POLICY "public_read" ON self_communication_comments FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON self_communication_comments FOR INSERT WITH CHECK (auth.uid() = author_uid);
CREATE POLICY "own_or_admin_delete" ON self_communication_comments FOR DELETE USING (auth.uid() = author_uid OR is_admin());
