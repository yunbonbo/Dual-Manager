# Vercel 環境変数の確認手順

「Supabase の URL または anon key が設定されていません」と表示される場合の確認方法です。

---

## Stripe 関連の環境変数（Vercel に登録する値）

`.env` の Stripe 設定を Vercel に入れる場合：

| Vercel の Name | Value（.env の値から） | 注意 |
|----------------|------------------------|------|
| `STRIPE_SECRET_KEY` | `sk_test_51...` の部分のみ | 引用符 `"` は付けない |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` の部分のみ | 引用符 `"` は付けない |
| `NUXT_PUBLIC_STRIPE_ENABLED` | `true` | 文字列の `true` |

**正しい例（Value 欄に入力する内容）:**
- `sk_test_xxxx...`（Stripe ダッシュボードの Secret key をそのままコピー）
- `whsec_xxxx...`（Stripe Webhook の Signing secret をそのままコピー）

**誤り（引用符を入れない）:**
- `"sk_test_51..."`
- `"whsec_..."`

---

## 確認の順番

### ステップ 1: Vercel ダッシュボードを開く

1. [vercel.com](https://vercel.com) にログイン
2. プロジェクト一覧から **Dual-Manager**（またはあなたのプロジェクト名）をクリック

---

### ステップ 2: 環境変数ページへ移動

1. 画面上部のタブで **Settings** をクリック
2. 左サイドバーで **Environment Variables** をクリック

---

### ステップ 3: 変数名を確認（重要）

以下の **2 つ** が存在するか確認してください。**名前は完全一致**である必要があります。

| 変数名 | 正しい例 | よくある間違い |
|--------|----------|----------------|
| `NUXT_PUBLIC_SUPABASE_URL` | そのまま | `NEXT_PUBLIC_SUPABASE_URL`（Next.js 用）、`SUPABASE_URL`、末尾にスペース |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | そのまま | `NEXT_PUBLIC_SUPABASE_ANON_KEY`（Next.js 用）、`SUPABASE_ANON_KEY`、`ANON_KEY` |

> ⚠️ **重要**: `NEXT_PUBLIC_` ではなく **`NUXT_PUBLIC_`** です。Next.js と Nuxt でプレフィックスが異なります。

**確認ポイント:**
- `NUXT_PUBLIC_` のプレフィックスが付いているか
- 大文字・小文字が一致しているか（すべて大文字）
- 前後にスペースが入っていないか

---

### ステップ 4: 値の確認

各変数の **Value** をクリックして表示し、以下を確認します。

#### NUXT_PUBLIC_SUPABASE_URL
- **形式**: `https://xxxx.supabase.co`
- **注意**: 末尾に `/` を付けない
- **例**: `https://sbxqopziszfuxhpueply.supabase.co`

#### NUXT_PUBLIC_SUPABASE_ANON_KEY
- **形式**: `eyJ` で始まる長い文字列（JWT）
- **注意**: 値の前後に `"`（ダブルクォート）を付けない
- **例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Vercel での入力例（正しい）:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHFvcHppc3pmdXhocHVlcGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzQzMTgsImV4cCI6MjA4NjIxMDMxOH0.xxxx
```

**誤り（ダブルクォートで囲まない）:**
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### ステップ 5: 適用環境を確認

各環境変数の右側に **Production / Preview / Development** のチェックがあります。

- **Production** にチェックが入っているか確認
- 本番の URL（`xxx.vercel.app`）でアクセスしている場合は Production が使われます

---

### ステップ 6: 再デプロイ（必須）

**環境変数を追加・変更した後は、必ず再デプロイが必要です。**

1. 画面上部のタブで **Deployments** をクリック
2. 一番上（最新）のデプロイの右端の **⋯**（3点リーダー）をクリック
3. **Redeploy** を選択
4. 「Use existing Build Cache」のチェックを **外す**（推奨）
5. **Redeploy** をクリック
6. ビルドが完了するまで数分待つ

---

## よくある原因

| 原因 | 対処 |
|------|------|
| **再デプロイしていない** | 環境変数はビルド時に埋め込まれるため、追加・変更後は必ず Redeploy |
| **変数名の typo** | `NUXT_PUBLIC_SUPABASE_ANON_KEY` を正確にコピー |
| **値に余分な引用符** | `"eyJ..."` ではなく `eyJ...` のまま入力 |
| **Production に未適用** | Environment Variables で Production にチェック |
| **別プロジェクトに設定** | 正しい Vercel プロジェクトの Settings を開いているか確認 |

---

## ローカルの .env からコピーする場合

1. プロジェクトの `.env` を開く
2. 次の行を探す：
   ```
   NUXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
   NUXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
   ```
3. **変数名**: `NUXT_PUBLIC_SUPABASE_URL` と `NUXT_PUBLIC_SUPABASE_ANON_KEY`
4. **値**: `=` の右側。**引用符 `"` は含めない**（Vercel の Value 欄には `https://...` や `eyJ...` だけを貼る）

---

## それでも解決しない場合

1. 環境変数を一度 **削除** して、手入力で **新規追加** し直す
2. Redeploy 時に **Build Cache を無効化** して再デプロイ
3. Supabase ダッシュボードで、プロジェクトの **Settings** → **API** から URL と anon key を再コピーして設定し直す
