# Supabase メニュー管理ガイド

## メニューの追加・修正・並び替え

### 方法1: Supabase Table Editor（GUI）

1. Supabase ダッシュボードにログイン
2. 左メニュー → **Table Editor** → **menus** テーブルを選択
3. **Insert** → **Insert row** で新規メニューを追加
4. 各カラムを入力：
   - `shop_id`: 所属する店舗の ID（shops テーブルからコピー）
   - `name`: メニュー名
   - `duration`: 所要時間（分）
   - `price`: 料金（円）
   - `display_order`: 表示順（小さい数字が上に表示）

### 方法2: SQL エディタ

1. Supabase ダッシュボード → **SQL Editor**
2. 新規クエリで SQL を実行

#### メニューを追加する例

```sql
INSERT INTO public.menus (shop_id, name, duration, price, display_order)
SELECT id, 'メニュー名', 60, 3000, 1
FROM public.shops WHERE name = '理容室';
```

#### 料金を修正する例

```sql
UPDATE public.menus
SET price = 3500
WHERE name = 'カット+シャンプー' 
AND shop_id = (SELECT id FROM public.shops WHERE name = '理容室');
```

#### 並び順を変更する例

```sql
UPDATE public.menus
SET display_order = 2
WHERE name = 'カット（学生）' 
AND shop_id = (SELECT id FROM public.shops WHERE name = '理容室');
```

## 一括追加用 SQL

`add_menus.sql` を SQL エディタに貼り付けて実行すると、以下のメニューが追加されます。

**理容室**
- カット（学生） 60分 3000円
- 顔そり 20分 1500円

**美容室**
- カット（学生） 60分 3000円
- ヘッドスパ 20分 3000円
- シミ消し（1ポイント） 150分 1500円
- シミ消しあて放題 60分 3500円

既存メニューの並び順も関連性の高い順に更新されます。
