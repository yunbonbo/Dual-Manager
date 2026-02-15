# Stripe オンライン決済 セットアップ手順

予約時にカード決済を行うには、Stripe の設定が必要です。

---

## 1. Stripe アカウント作成

1. [Stripe](https://stripe.com/jp) にアクセス
2. アカウントを作成
3. ダッシュボードにログイン
4. **テストモード**（右上トグル）を ON にして開発

---

## 2. API キーを取得

1. **Developers** → **API keys**
2. 以下をメモ：
   - **Publishable key**（`pk_test_...`）※本番では `pk_live_...`
   - **Secret key**（`sk_test_...`）※本番では `sk_live_...`、絶対に公開しない

---

## 3. 環境変数を設定

`.env` に追加：

```bash
# Stripe
STRIPE_SECRET_KEY="sk_test_xxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxx"
NUXT_PUBLIC_STRIPE_ENABLED="true"
```

- **STRIPE_SECRET_KEY**: 手順 2 の Secret key
- **STRIPE_WEBHOOK_SECRET**: 手順 5 で取得
- **NUXT_PUBLIC_STRIPE_ENABLED**: `"true"` にすると予約フォームに「事前にカードで支払う」が表示される

---

## 4. Webhook の設定

### ローカル開発時（Stripe CLI）

1. [Stripe CLI](https://stripe.com/docs/stripe-cli) をインストール
2. ターミナルで実行：
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. 表示される `whsec_...` を `.env` の `STRIPE_WEBHOOK_SECRET` に設定

### 本番環境（Stripe ダッシュボード）

#### ステップ 1: イベントを選択

1. Stripe ダッシュボード → **Developers** → **Webhooks** → **Add endpoint**
2. 「イベントを選択」画面で、一覧から **Checkout** を探す
3. **Checkout** の行をクリックして展開する（`>` をクリック）
4. 表示される 4 件のイベントのうち、**`checkout.session.completed`** にチェックを入れる
5. 右下の **続行 →** をクリック

#### ステップ 2: 送信先のタイプを選択

1. 「Webhook エンドポイント」を選択（通常はデフォルト）
2. **続行** をクリック

#### ステップ 3: 送信先を設定

1. **Endpoint URL** に以下を入力：
   ```
   https://あなたのドメイン/api/stripe/webhook
   ```

**「あなたのドメイン」とは？**

| 環境 | 例 | 説明 |
|------|-----|------|
| **ローカル開発** | `http://localhost:3000` は使えない | Stripe のサーバーはインターネット上にあり、あなたの PC の localhost には届きません。ローカル開発時は **Stripe CLI**（上記「ローカル開発時」）を使い、ダッシュボードでの Webhook 作成は不要です。 |
| **本番・デプロイ後** | `https://your-app.vercel.app`<br>`https://example.com` | 実際にインターネットからアクセスできる URL。Vercel、Netlify、自前サーバーなどにデプロイした後の URL を指定します。 |
2. **エンドポイントを追加**（または **Add endpoint**）をクリック

#### ステップ 4: Signing secret を取得

1. 作成した Webhook の詳細ページが開く
2. **Signing secret** の「表示」をクリック
3. 表示される `whsec_...` をコピーし、`.env` の `STRIPE_WEBHOOK_SECRET` に設定

---

## 5. 動作確認

1. `npm run dev` で起動
2. 予約フォームで「事前にカードで支払う」にチェック
3. 予約を確定すると Stripe の決済画面に遷移
4. テストカードで支払い：
   - **成功**: `4242 4242 4242 4242`
   - **残高不足**: `4000 0000 0000 9995`
   - 有効期限: 任意の未来の日付
   - CVC: 任意の 3 桁
   - 郵便番号: 任意

---

## 注意事項

- **本番運用時**は Stripe ダッシュボードで **Live モード** に切り替え、Live 用の API キーと Webhook を設定してください
- 金額はクライアントから送信されますが、メニュー料金は Supabase の `menus` テーブルと連動しています。不正防止のため、将来的にはサーバー側でメニュー価格を検証することを推奨します
