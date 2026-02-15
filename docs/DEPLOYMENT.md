# Vercel へのデプロイ手順

未完成のアプリでもデプロイ可能です。デプロイ後も何度でも更新できます。

---

## 質問への回答

| 質問 | 回答 |
|------|------|
| **先に Vercel に登録する必要がある？** | はい。デプロイには Vercel アカウントが必要です。無料プランで十分です。 |
| **デプロイ後も更新できる？** | **はい。** 何度でもデプロイし直せます。不具合は出ません。コードを変更 → 再デプロイ の繰り返しが標準の開発フローです。 |
| **Stripe Webhook のため先にドメインが必要？** | **その理解で合っています。** Stripe ダッシュボードで Webhook を設定するには、インターネットからアクセスできる URL が必要です。Vercel にデプロイすると `https://プロジェクト名.vercel.app` が自動で発行されます。 |

---

## 1. Vercel に登録

1. [Vercel](https://vercel.com) にアクセス
2. **Sign Up** をクリック
3. **GitHub** でサインアップ（推奨）または **Email** で登録
4. GitHub 連携の場合、Vercel がリポジトリにアクセスする許可を求められたら **Authorize** をクリック

---

## 2. プロジェクトを GitHub にプッシュ（未実施の場合）

Vercel は GitHub のリポジトリからデプロイするのが一般的です。

1. [GitHub](https://github.com) でリポジトリを作成
2. ローカルで以下を実行：

```bash
git add .
git commit -m ""
git push -u origin main
```

> `.env` は `.gitignore` に含まれているため、Git には含まれません。環境変数は Vercel で別途設定します。

---

## 3. Vercel にデプロイ

1. [Vercel ダッシュボード](https://vercel.com/dashboard) にログイン
2. **Add New** → **Project** をクリック
3. **Import Git Repository** で GitHub のリポジトリを選択
4. **Framework Preset** が **Nuxt.js** になっていることを確認
5. **Deploy** をクリック（まずはこのまま進めて OK）

初回デプロイが完了すると、`https://dual-manager-xxxx.vercel.app` のような URL が発行されます。

---

## 4. 環境変数を設定

デプロイ後、アプリが正しく動くには環境変数の設定が必要です。

1. Vercel ダッシュボード → プロジェクトを選択
2. **Settings** → **Environment Variables**
3. 以下を追加（`.env` の内容をコピー）：

| Name | Value |
|------|-------|
| `NUXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` または `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `NUXT_PUBLIC_STRIPE_ENABLED` | `true` |
| `NUXT_PUBLIC_EMAILJS_PUBLIC_KEY` | （設定している場合） |
| `NUXT_PUBLIC_EMAILJS_SERVICE_ID` | （設定している場合） |
| `NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER` | （設定している場合） |
| `NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN` | （設定している場合） |
| `NUXT_PUBLIC_ADMIN_EMAIL` | （設定している場合） |

4. **Save** をクリック
5. **Deployments** タブ → 最新のデプロイの **⋯** → **Redeploy** で再デプロイ（環境変数を反映）

> ⚠️ 「Supabase の URL または anon key が設定されていません」と表示される場合は、**[docs/VERCEL_ENV_CHECK.md](VERCEL_ENV_CHECK.md)** で確認手順を参照してください。

---

## 5. Stripe Webhook を設定

### ステップ A: Vercel の URL を確認

1. ブラウザで [vercel.com](https://vercel.com) を開く
2. ログインして、**Dual-Manager** プロジェクトをクリック
3. 画面上部の **Domains** またはデプロイ一覧で、表示されている URL を確認  
   例: `https://dual-manager-bwmfbgds7-yuki-matsumuras-projects.vercel.app`
4. この URL の末尾に **`/api/stripe/webhook`** を付けたものが Webhook 用 URL です  
   例: `https://dual-manager-bwmfbgds7-yuki-matsumuras-projects.vercel.app/api/stripe/webhook`

> ⚠️ **重要**: ルート（`/`）だけでなく、必ず `/api/stripe/webhook` まで含めます。

---

### ステップ B: Stripe で Webhook を作成

1. ブラウザで [dashboard.stripe.com](https://dashboard.stripe.com) を開く
2. ログインする（右上が **サンドボックス** になっていることを確認）
3. 左上の **「Developers」**（開発者）をクリック
4. 左メニューで **「Webhooks」** をクリック
5. **「Add endpoint」**（エンドポイントを追加）ボタンをクリック
6. **「イベントを選択」** 画面で：
   - 一覧から **「Checkout」** をクリックして展開
   - **`checkout.session.completed`** にチェックを入れる
   - 右下の **「続行」** をクリック
7. **「送信先のタイプを選択」** で **「Webhook エンドポイント」** を選び **「続行」**
8. **「Endpoint URL」** に、ステップ A で確認した URL を入力  
   例: `https://dual-manager-bwmfbgds7-yuki-matsumuras-projects.vercel.app/api/stripe/webhook`
9. **「エンドポイントを追加」** をクリック

---

### ステップ C: Signing secret を Vercel に登録

1. Webhook 作成後、**「送信先の詳細」** 画面が開く
2. **「署名シークレット」**（Signing secret）の横にある **コピーアイコン** をクリック  
   値は `whsec_...` で始まります
3. 新しいタブで [vercel.com](https://vercel.com) を開く
4. **Dual-Manager** プロジェクト → **Settings** → **Environment Variables**
5. **「Add New」** → **「Environment Variable」** をクリック
6. **Name**: `STRIPE_WEBHOOK_SECRET`
7. **Value**: コピーした `whsec_...` を貼り付け（引用符は付けない）
8. **Save** をクリック
9. **Deployments** タブ → 最新デプロイの **⋯** → **Redeploy** で再デプロイ

---

### 既に Webhook を作成済みの場合

画像の Endpoint URL が `https://...vercel.app/` のみで、`/api/stripe/webhook` が付いていない場合は誤りです。

1. Stripe の Webhook 詳細で **「送信先を編集」** をクリック
2. **Endpoint URL** を `https://あなたのURL.vercel.app/api/stripe/webhook` に修正
3. 保存する

---

## 6. 今後の更新フロー

1. ローカルでコードを編集
2. 変更をコミットして GitHub にプッシュ：
   ```bash
   git add .
   git commit -m "〇〇を修正"
   git push
   ```
3. Vercel が自動で検知し、**新しいデプロイが開始**されます
4. 数分で新しいバージョンが公開されます

**不具合について**: 通常は問題ありません。もしデプロイ後にエラーが出ても、前のバージョンにロールバックしたり、修正して再プッシュしたりできます。

---

## 補足: デプロイ前でも Stripe を試す方法

デプロイせずに Stripe を試す場合は、**Stripe CLI** を使います：

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

これでローカル開発中も Webhook を受け取れます。ドメインは不要です。
