-- ============================================
-- メニュー追加・並び順設定用 SQL
-- Supabase の SQL エディタで実行してください
-- ============================================

-- 1. display_order カラムを追加（並び順用）
ALTER TABLE public.menus
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- 2. 新規メニューを追加
-- 理容室
INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, 'カット（学生）', 60, 3000, 2
FROM public.shops s
WHERE s.name = '理容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = 'カット（学生）');

INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, '顔そり', 20, 1500, 3
FROM public.shops s
WHERE s.name = '理容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = '顔そり');

-- 美容室
INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, 'カット（学生）', 60, 3000, 2
FROM public.shops s
WHERE s.name = '美容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = 'カット（学生）');

INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, 'ヘッドスパ', 20, 3000, 3
FROM public.shops s
WHERE s.name = '美容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = 'ヘッドスパ');

INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, 'シミ消し（1ポイント）', 150, 1500, 4
FROM public.shops s
WHERE s.name = '美容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = 'シミ消し（1ポイント）');

INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT s.id, 'シミ消しあて放題', 60, 3500, 5
FROM public.shops s
WHERE s.name = '美容室'
AND NOT EXISTS (SELECT 1 FROM public.menus m WHERE m.shop_id = s.id AND m.name = 'シミ消しあて放題');

-- 3. 既存メニューの display_order を更新（関連性の高い順）
-- 理容室: カット系→顔そり→カラー→パーマ
UPDATE public.menus SET display_order = 1
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '理容室') AND name = 'カット+シャンプー';

UPDATE public.menus SET display_order = 2
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '理容室') AND name = 'カット（学生）';

UPDATE public.menus SET display_order = 3
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '理容室') AND name = '顔そり';

UPDATE public.menus SET display_order = 4
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '理容室') AND name = 'カット+カラー';

UPDATE public.menus SET display_order = 5
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '理容室') AND name = 'パーマ+トリートメント';

-- 美容室: カット系→ヘッドスパ→シミ消し系→カラー→パーマ
UPDATE public.menus SET display_order = 1
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'カット+シャンプー';

UPDATE public.menus SET display_order = 2
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'カット（学生）';

UPDATE public.menus SET display_order = 3
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'ヘッドスパ';

UPDATE public.menus SET display_order = 4
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'シミ消し（1ポイント）';

UPDATE public.menus SET display_order = 5
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'シミ消しあて放題';

UPDATE public.menus SET display_order = 6
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'カット+カラー';

UPDATE public.menus SET display_order = 7
WHERE shop_id = (SELECT id FROM public.shops WHERE name = '美容室') AND name = 'パーマ+トリートメント';
