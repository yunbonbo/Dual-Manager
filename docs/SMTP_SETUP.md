# Gmail SMTP メール送信 セットアップ（ドメイン不要・すぐ届く）

Resend でメールが届かない場合、**Gmail SMTP** を使うとドメイン認証なしで届きます。

---

## なぜ Resend で届かないか

Resend の `onboarding@resend.dev` は**任意のアドレスには送れません**。顧客・管理者に届けるには、[Resend でドメイン認証](https://resend.com/domains)が必要です。

Gmail SMTP なら、**自分の Gmail アカウント**から直接送信するため、ドメイン認証は不要です。

---

## 1. Google アカウントでアプリパスワードを作成（約3分）

1. [Google アカウント](https://myaccount.google.com/) にログイン
2. **セキュリティ** を開く
3. **2段階認証** を有効にする（まだの場合）
4. **アプリパスワード** を開く  
   （2段階認証が有効でないと表示されません）
5. **アプリを選択** → **メール**
6. **デバイスを選択** → **その他** → 名前を入力（例: `Dual-Manager`）
7. **生成** をクリック
8. 表示された **16文字のパスワード** をコピー（スペースは無視してOK）

---

## 2. 環境変数を設定

`.env` に以下を追加：

```bash
# Gmail SMTP（ドメイン不要で届く）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="あなたのGmailアドレス@gmail.com"
SMTP_PASS="先ほどコピーした16文字のアプリパスワード"
SMTP_FROM="予約システム <あなたのGmailアドレス@gmail.com>"
```

**例：**

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="yunbonbonbo@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"
SMTP_FROM="予約システム <yunbonbonbo@gmail.com>"
```

> ⚠️ `SMTP_PASS` は Gmail の通常パスワードではなく、**アプリパスワード**を指定してください。

---

## 3. Resend を無効にする（任意）

Gmail SMTP を使う場合、Resend の環境変数は削除するか、SMTP より後に読み込まれるようにしてください。  
このシステムでは **SMTP が Resend より優先**されるため、`SMTP_USER` と `SMTP_PASS` を設定すれば SMTP が使われます。

---

## 4. アプリを再起動

```bash
npm run dev
```

---

## Vercel デプロイ時

Vercel の **Settings** → **Environment Variables** に以下を追加：

| Name | Value |
|------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | あなたの Gmail アドレス |
| `SMTP_PASS` | アプリパスワード（16文字） |
| `SMTP_FROM` | `予約システム <あなたのGmail@gmail.com>` |

追加後、**Redeploy** を実行してください。

---

## 注意事項

- Gmail の1日あたりの送信数には制限があります（目安: 500通/日）
- 本番で大量送信する場合は、Resend のドメイン認証や SendGrid などの専用サービスを検討してください
