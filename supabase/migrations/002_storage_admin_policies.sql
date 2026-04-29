-- ============================================
-- Storage RLS + 관리자 판별 보강
-- ============================================

-- 관리자 판별을 이메일 대소문자/메타데이터(role=admin)까지 허용
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'kimmg1237@gmail.com'
    OR coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

-- public-assets 버킷의 객체 정책 정리
DROP POLICY IF EXISTS "public_assets_read" ON storage.objects;
DROP POLICY IF EXISTS "public_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "public_assets_admin_delete" ON storage.objects;

-- 읽기: 공개
CREATE POLICY "public_assets_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public-assets');

-- 쓰기/수정/삭제: 관리자만
CREATE POLICY "public_assets_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'public-assets' AND is_admin());

CREATE POLICY "public_assets_admin_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'public-assets' AND is_admin())
WITH CHECK (bucket_id = 'public-assets' AND is_admin());

CREATE POLICY "public_assets_admin_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'public-assets' AND is_admin());
