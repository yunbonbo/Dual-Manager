# Dual-Manager

理容室と美容室を営む夫婦のための、2 店舗統合予約管理システム

## 📋 プロジェクト概要

- **アプリ名**: Dual-Manager
- **コンセプト**: 美容室と理容室を営む夫婦のための、2 店舗統合予約管理システム
- **ターゲット**: スマホ予約をメインとする顧客および店舗オーナー
- **開発スタック**: Nuxt 4, Supabase, Tailwind CSS（将来実装予定）, V-Calendar（将来実装予定）

## ✅ 実装済み機能（MVP）

### 1. 予約フォーム（`pages/index.vue`）

- **ステップ 1: 店舗・メニュー選択**
  - 店舗選択（理容室 / 美容室）
  - メニュー選択（メニュー名、所要時間、料金を表示）
- **ステップ 2: 日時選択**

  - カレンダーで日付選択（月曜日と第 2・第 3 火曜日は選択不可）
  - 15 分刻みの時間選択（9:00〜17:00、最終受付 17:00）
  - メニューの所要時間を考慮して、終了時刻が営業時間内か自動チェック

- **ステップ 3: 情報入力**
  - 必須項目: お名前、フリガナ、電話番号、メールアドレス
  - 任意項目（アコーディオン）: 性別、誕生日（年・月・日の 3 つのセレクトボックス）
  - 予約内容の確認（店舗、メニュー、日時、所要時間、合計金額）
  - Supabase の `reservations` テーブルに予約を保存

### 2. オーナーダッシュボード（`pages/dashboard.vue`）

- 2 店舗の予約を時系列で一覧表示
- フィルター機能（店舗、予約状態）
- 管理者メモの編集機能（リアルタイム保存）
- 予約状態の変更機能（pending / confirmed / cancelled）
- 店舗ごとの色分け表示（shops テーブルの `color` を使用）

## 🗄️ データベース設計（Supabase）

### テーブル構造

1. **`shops` テーブル**

   - `id` (uuid, PK)
   - `name` (text) - 店舗名
   - `color` (text) - 管理画面での表示色（HEX コード）

2. **`menus` テーブル**

   - `id` (uuid, PK)
   - `shop_id` (uuid, FK) - 所属する店舗の ID
   - `name` (text) - メニュー名
   - `duration` (integer) - 所要時間（分）
   - `price` (integer) - 料金

3. **`reservations` テーブル**
   - `id` (uuid, PK)
   - `shop_id` (uuid, FK)
   - `menu_id` (uuid, FK)
   - `start_at` (timestamptz) - 予約開始日時
   - `end_at` (timestamptz) - 予約終了日時（自動算出）
   - `name` (text) - 顧客名
   - `name_kana` (text) - フリガナ
   - `tel` (text) - 電話番号
   - `email` (text) - メールアドレス
   - `gender` (text, 任意) - 性別
   - `birthday` (date, 任意) - 誕生日
   - `admin_memo` (text) - 管理者メモ
   - `status` (text) - 予約状態（pending, confirmed, cancelled）
   - `created_at` (timestamptz) - 予約申込日時

### SQL セットアップ

Supabase の SQL エディタで以下の SQL を実行してください：

```sql
-- UUID 生成用拡張機能
create extension if not exists "pgcrypto";

-- ① shops テーブル
create table if not exists public.shops (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  color text
);

-- ② menus テーブル
create table if not exists public.menus (
  id       uuid primary key default gen_random_uuid(),
  shop_id  uuid not null references public.shops(id) on delete restrict,
  name     text not null,
  duration integer not null,
  price    integer not null
);

-- ③ reservations テーブル
create table if not exists public.reservations (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete restrict,
  menu_id    uuid not null references public.menus(id) on delete restrict,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  name       text not null,
  name_kana  text not null,
  tel        text not null,
  email      text not null,
  gender     text,
  birthday   date,
  admin_memo text,
  status     text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint reservations_status_check
    check (status in ('pending', 'confirmed', 'cancelled'))
);

-- インデックス
create index if not exists idx_menus_shop_id on public.menus(shop_id);
create index if not exists idx_reservations_shop_id_start_at on public.reservations(shop_id, start_at);
create index if not exists idx_reservations_menu_id on public.reservations(menu_id);
```

## ⚙️ 環境設定

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下を設定：

```bash
NUXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NUXT_PUBLIC_SUPABASE_ANON_KEY="xxxxxxxxxxxxxxxx"
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

- 予約フォーム: `http://localhost:3000/`
- ダッシュボード: `http://localhost:3000/dashboard`

## 📝 営業ルール

- **営業時間**: 9:00〜18:00（理容室・美容室共通）
- **最終受付**: 17:00
- **休憩時間**: なし
- **定休日**: 毎週月曜日、第 2・第 3 火曜日
- **予約間隔**: 15 分刻み

## 🎨 UI/UX 設計指針

- **スマホファースト**: 全てのボタンは親指で押しやすいサイズ（最小 44px）
- **直感的なフィードバック**: 店舗選択時は画像ボタンを使用し、選択状態を視覚的に強調
- **入力負担の軽減**: 性別や誕生日はアコーディオン形式で隠し、必須項目を優先的に表示

## 🚀 次のステップ（フェーズ 2）

- [ ] 認証機能（Login）
- [ ] EmailJS による自動メール通知
- [ ] 写真アップロード機能付きの施術カルテ
- [ ] ユーザー用セルフキャンセル画面
- [ ] デザイン調整（添付イメージに合わせる）

## 📁 プロジェクト構成

```
Dual-Manager/
├── app/                    # Nuxt アプリケーション設定（現在は空）
├── pages/
│   ├── index.vue          # 予約フォーム（トップページ）
│   └── dashboard.vue      # オーナーダッシュボード
├── public/                # 静的ファイル
├── .env                   # 環境変数（.gitignore に含まれている）
├── nuxt.config.ts         # Nuxt 設定
└── package.json           # 依存関係
```

## 🔧 トラブルシューティング

### 白い画面が表示される場合

1. `.nuxt` ディレクトリを削除して再生成：

   ```bash
   rm -rf .nuxt && npm run postinstall
   ```

2. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```

### Supabase の接続エラー

- `.env` ファイルに正しい Supabase URL と anon key が設定されているか確認
- Supabase ダッシュボードで RLS（Row Level Security）が無効になっているか確認

## 📚 参考資料

- [Nuxt 4 ドキュメント](https://nuxt.com/docs)
- [Supabase ドキュメント](https://supabase.com/docs)

##プルリクエストの練習です

##第二回プルリクエストの練習です
