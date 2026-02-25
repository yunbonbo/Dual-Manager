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
  - **予約済み時間はグレーアウト**（既存予約と重複する時間は選択不可）
  - **当日予約の猶予時間**（管理者設定、デフォルト 3 時間前までに申し込み可能）

- **ステップ 3: 情報入力**
  - 必須項目: お名前、フリガナ、電話番号、メールアドレス
  - 任意項目（アコーディオン）: 性別、誕生日（年・月・日の 3 つのセレクトボックス）
  - 予約内容の確認（店舗、メニュー、日時、所要時間、合計金額）
  - Supabase の `reservations` テーブルに予約を保存

### 2. オーナーダッシュボード（`pages/dashboard.vue`）※要ログイン

- **ログイン必須**：Supabase Auth でメール/パスワード認証
- 2 店舗の予約を時系列で一覧表示
- フィルター機能（店舗、予約状態）
- 管理者メモの編集機能（リアルタイム保存）
- 予約状態の変更機能（pending / confirmed / cancelled）
- 店舗ごとの色分け表示（shops テーブルの `color` を使用）
- **予約設定**：当日予約の最低猶予時間（時間単位）を設定・変更可能

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

3. **`settings` テーブル**（予約設定）

   - `key` (text, PK) - 設定キー
   - `value` (text) - 設定値
   - 例: `min_hours_before_booking` = 当日予約の最低猶予時間（時間）

4. **`closed_dates` テーブル**（臨時休業日）

   - `date` (date, PK) - 休業日
   - ダッシュボードのカレンダーでクリックして追加・解除

5. **`closed_day_rules` テーブル**（定休日ルール）

   - `id`, `weekday` (0-6), `week_of_month` (null=毎週, 1-4=第N週)
   - ダッシュボードで追加・削除可能

6. **`open_dates` テーブル**（臨時営業日）

   - `date` (date, PK) - 通常は定休だが営業する日
   - ダッシュボードのカレンダーで定休日をクリックして追加

7. **`reservations` テーブル**
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

-- settings テーブル（予約設定）
create table if not exists public.settings (
  key   text primary key,
  value text not null
);
insert into public.settings (key, value) values ('min_hours_before_booking', '3')
on conflict (key) do update set value = excluded.value;

-- closed_dates テーブル（臨時休業日）
create table if not exists public.closed_dates (
  date date primary key
);

-- closed_day_rules テーブル（定休日ルール）
create table if not exists public.closed_day_rules (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday >= 0 and weekday <= 6),
  week_of_month integer check (week_of_month is null or (week_of_month >= 1 and week_of_month <= 4))
);

-- open_dates テーブル（臨時営業日）
create table if not exists public.open_dates (
  date date primary key
);

-- cancel_token（ユーザー側キャンセル用）
alter table public.reservations
add column if not exists cancel_token uuid default gen_random_uuid();
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

# メール通知 ※いずれかを設定
# Brevo（推奨・Vercel で届く）: docs/BREVO_SETUP.md
BREVO_API_KEY=""
BREVO_SENDER_EMAIL=""
# Gmail SMTP: docs/SMTP_SETUP.md
SMTP_USER=""
SMTP_PASS=""
# Resend（ドメイン認証必須）: docs/RESEND_SETUP.md
RESEND_API_KEY=""
NUXT_PUBLIC_EMAIL_ENABLED="true"
# EmailJS: docs/EMAILJS_SETUP.md
NUXT_PUBLIC_EMAILJS_PUBLIC_KEY=""
NUXT_PUBLIC_EMAILJS_SERVICE_ID=""
NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER=""
NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN=""
NUXT_PUBLIC_ADMIN_EMAIL=""
EMAILJS_PRIVATE_KEY=""

# オンライン決済（Stripe）※任意
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NUXT_PUBLIC_STRIPE_ENABLED="false"
```

Stripe の詳細セットアップは **[docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)** を参照してください。

### 3. 認証の設定（Supabase）

ログイン機能の詳細なセットアップ手順は **[docs/LOGIN_SETUP.md](docs/LOGIN_SETUP.md)** を参照してください。

**概要:**
1. Supabase ダッシュボード → **Authentication** → **Providers** で **Email** を有効化
2. **Authentication** → **Users** → **Add user** で管理者アカウントを作成

### 4. 開発サーバーの起動

```bash
npm run dev
```

- 予約フォーム: `http://localhost:3000/`（ポートは環境により 3001 等になる場合あり）

### 5. デプロイ（Vercel）

本番環境へのデプロイ手順は **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** を参照してください。
- ログイン: `http://localhost:3000/login`
- ダッシュボード: `http://localhost:3000/dashboard`（ログイン後にアクセス可能）

## 🔐 認証（ログイン・ログイン情報記憶）

- ダッシュボードはログイン必須
- Supabase Auth のセッションはブラウザ（localStorage）に自動保存
- ログアウトするまでログイン状態が維持される

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

## 📧 メール通知・ユーザーキャンセル

- **Brevo**（推奨）: Vercel で確実に届く。セットアップ: [docs/BREVO_SETUP.md](docs/BREVO_SETUP.md)
- **Gmail SMTP**: ドメイン不要。セットアップ: [docs/SMTP_SETUP.md](docs/SMTP_SETUP.md)
- **Resend**: ドメイン認証必須。セットアップ: [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md)
- **EmailJS**: 代替。セットアップ: [docs/EMAILJS_SETUP.md](docs/EMAILJS_SETUP.md)
- **ユーザー側キャンセル**: 予約確認メールのリンクから `/cancel?token=xxx` でキャンセル可能
- **メールが届かない場合**: [docs/SETUP_EMAIL_AND_CALENDAR.md](docs/SETUP_EMAIL_AND_CALENDAR.md) を参照

## 📅 カレンダー連携

- **Googleカレンダーに追加**: 1クリックで予約内容が入力された画面を開く（保存で追加）
- **.ics ダウンロード**: Outlook・Apple カレンダー等にインポート可能
- セットアップ: [docs/CALENDAR_SETUP.md](docs/CALENDAR_SETUP.md)

## 💳 オンライン決済（Stripe）

- **事前支払い**: 予約フォームで「事前にカードで支払う」を選択すると Stripe Checkout で決済
- セットアップ: [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)

## 🚀 開発ロードマップ（実施順）

上から順に実装を進めます。

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| 1 | 認証機能（Login） | ✅ 完了 | |
| 2 | EmailJS による自動メール通知 | ✅ 完了 | |
| 3 | ユーザー用セルフキャンセル画面 | ✅ 完了 | |
| 4 | デザイン調整（添付イメージに合わせる） | ⬜ 未着手 | |
| **5** | **カレンダー連携** | ✅ 完了 | .ics ダウンロード実装済み。セットアップ: [docs/CALENDAR_SETUP.md](docs/CALENDAR_SETUP.md) |
| **6** | **オンライン決済（Stripe）** | ✅ 完了 | Stripe Checkout 実装済み。セットアップ: [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) |
| 7 | デザイン調整（続き） | ⬜ 未着手 | |
| **8** | **写真付きカルテ** | ⬜ 未着手 | 施術記録用テーブルと画像アップロードの設計が必要 |

### カレンダー連携の案

- **.ics ダウンロード**（まず実装）: 予約確定時に .ics ファイルをダウンロード。顧客・管理者ともに Google カレンダー等へ手動インポート可能
- **Google カレンダー API 連携**（将来）: 管理者の Google カレンダーへ自動登録。OAuth 設定が必要

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

##review-request 作成しました
