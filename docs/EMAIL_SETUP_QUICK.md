# メール送信 最良の手順（課金不要）

EmailJS は課金が発生する場合があるため、**Brevo** または **Gmail SMTP** を推奨します。

---

## 最良の手順（Brevo・約5分）

### 1. Brevo アカウント作成

1. [brevo.com](https://www.brevo.com) で「無料で始める」
2. メールアドレスとパスワードで登録
3. 認証メールのリンクをクリック

### 2. 送信元メールを認証（必須）

1. 設定 → 送信元 → 送信元を追加
2. 送信に使うメールアドレスを入力（例: Gmail）
3. 届いた認証メールの「認証する」をクリック

### 3. API キーを取得

1. 設定 → API キー → 生成
2. 権限で「メール送信」にチェック
3. 表示されたキー（`xkeysib-` で始まる）をコピー

### 4. 環境変数を設定

**ローカル（.env）:**

```bash
BREVO_API_KEY="xkeysib-コピーしたキー"
BREVO_SENDER_EMAIL="認証したメールアドレス@gmail.com"
BREVO_SENDER_NAME="予約システム"
NUXT_PUBLIC_EMAIL_ENABLED="true"
NUXT_PUBLIC_ADMIN_EMAIL="管理者のメールアドレス"
```

**Vercel:**

1. Settings → Environment Variables
2. 上記の変数を追加
3. Deployments → Redeploy

### 5. 動作確認

- ローカル: `http://localhost:3000/email-test`
- Vercel: `https://あなたのサイト.vercel.app/email-test`

メールアドレスを入力して「テストメールを送信」をクリック。届けば成功です。

---

## 代替: Gmail SMTP（既存 Gmail で届く）

Gmail をお持ちなら、アプリパスワードだけで設定できます。

**手順:** [SMTP_SETUP.md](SMTP_SETUP.md) を参照

---

## 優先順位

このシステムでは、次の順でメール送信を試します：

1. **Brevo**（無料 300通/日）
2. **Gmail SMTP**（無料・ドメイン不要）
3. **Resend**（ドメイン認証が必要）
4. **EmailJS**（課金が発生する場合あり・フォールバック）
