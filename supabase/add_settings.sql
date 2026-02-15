-- ============================================
-- 予約設定用テーブル（管理者が変更可能）
-- Supabase の SQL エディタで実行してください
-- ============================================

CREATE TABLE IF NOT EXISTS public.settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- 当日予約の最低猶予時間（時間単位）。例: 3 = 3時間前までに予約可能
INSERT INTO public.settings (key, value)
VALUES ('min_hours_before_booking', '3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
