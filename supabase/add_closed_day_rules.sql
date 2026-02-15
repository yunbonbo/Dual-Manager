-- ============================================
-- 定休日ルール・臨時営業日テーブル
-- Supabase の SQL エディタで実行してください
-- ============================================

-- 定休日ルール（weekday: 0=日 1=月 ... 6=土、week_of_month: null=毎週 1=第1週 2=第2週 3=第3週 4=第4週）
CREATE TABLE IF NOT EXISTS public.closed_day_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  week_of_month integer CHECK (week_of_month IS NULL OR (week_of_month >= 1 AND week_of_month <= 4)),
  created_at timestamptz DEFAULT now()
);

-- 臨時営業日（通常は定休だが営業する日）
CREATE TABLE IF NOT EXISTS public.open_dates (
  date date PRIMARY KEY
);

-- 初期データ：従来の定休日（月曜、第2・第3火曜）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.closed_day_rules LIMIT 1) THEN
    INSERT INTO public.closed_day_rules (weekday, week_of_month) VALUES
      (1, NULL),
      (2, 2),
      (2, 3);
  END IF;
END $$;
