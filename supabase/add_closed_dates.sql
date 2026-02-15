-- ============================================
-- 臨時休業日テーブル（管理者がダッシュボードで設定）
-- Supabase の SQL エディタで実行してください
-- ============================================

CREATE TABLE IF NOT EXISTS public.closed_dates (
  date date PRIMARY KEY
);

COMMENT ON TABLE public.closed_dates IS '臨時休業日（定休日以外で休みにする日）';
