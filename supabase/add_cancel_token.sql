-- ============================================
-- 予約キャンセル用トークン（ユーザー側キャンセル用）
-- Supabase の SQL エディタで実行してください
-- ============================================

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS cancel_token uuid DEFAULT gen_random_uuid();

-- 既存レコードにトークンを付与
UPDATE public.reservations
SET cancel_token = gen_random_uuid()
WHERE cancel_token IS NULL;
