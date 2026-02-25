# Resend メール送信 セットアップ

> ⚠️ **メールが届かない場合**: Resend は**ドメイン認証が必須**です。`onboarding@resend.dev` では任意のアドレスに送れません。すぐ届けたい場合は **[Gmail SMTP](SMTP_SETUP.md)** を推奨します。

---

## 1. Resend アカウント作成（2分）

1. [https://resend.com](https://resend.com) にアクセス
2. **Sign Up** でアカウント作成（Google または Email）
3. ログイン後、メールアドレス認証を完了

---

## 2. API キーを取得

1. [https://resend.com/api-keys](https://resend.com/api-keys) を開く
2. **Create API Key** をクリック
3. 名前を入力（例: `Dual-Manager`）
4. **Add** をクリック
5. 表示された API キー（`re_xxxxx`）をコピー

> ⚠️ このキーは一度しか表示されません。必ずコピーして保存してください。

---

## 3. ドメインを追加（本番用・任意）

**テスト時**は `onboarding@resend.dev` で送信できます（無料 100通/日）。

**本番で顧客に届ける**場合は、自分のドメインを追加してください。

1. [https://resend.com/domains](https://resend.com/domains) を開く
2. **Add Domain** をクリック
3. ドメインを入力（例: `example.com`）
4. 表示された **SPF** と **DKIM** の DNS レコードを、ドメインの DNS 設定に追加
5. **Verify** をクリックして確認

ドメイン認証後、送信元を `noreply@あなたのドメイン.com` のように設定できます。

---

## 4. 環境変数を設定

`.env` に以下を追加：

```bash
# Resend（メール送信・届きやすい）
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
NUXT_PUBLIC_EMAIL_ENABLED="true"
NUXT_PUBLIC_ADMIN_EMAIL="管理者のメールアドレス"

# 送信元（ドメイン認証後は変更）
RESEND_FROM_EMAIL="予約システム <onboarding@resend.dev>"
```

| 変数 | 説明 |
|------|------|
| `RESEND_API_KEY` | Resend の API キー（必須） |
| `NUXT_PUBLIC_EMAIL_ENABLED` | `true` に設定（必須） |
| `NUXT_PUBLIC_ADMIN_EMAIL` | 管理者のメールアドレス |
| `RESEND_FROM_EMAIL` | 送信元。ドメイン認証後は `予約 <noreply@yourdomain.com>` に変更 |

---

## 5. アプリを再起動

```bash
npm run dev
```

---

## 6. 動作確認

1. 予約を1件作成
2. 顧客メールアドレスに届くか確認
3. 管理者メールにも届くか確認
4. 届かない場合は **迷惑メールフォルダ** を確認

---

## Vercel デプロイ時

Vercel の **Settings** → **Environment Variables** に以下を追加：

- `RESEND_API_KEY`
- `NUXT_PUBLIC_EMAIL_ENABLED` = `true`
- `NUXT_PUBLIC_ADMIN_EMAIL`
- `RESEND_FROM_EMAIL`（任意）

---

## 無料枠

- **100通/日**、**3,000通/月**
- 小規模の予約システムなら十分です
