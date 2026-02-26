# メール送信・カレンダー連携 セットアップガイド（初めての方向け）

予約完了後にメールが届かない、カレンダーに反映されない場合の解決手順です。

---

## 目次

1. [メールが届かない場合](#1-メールが届かない場合)
2. [カレンダーに反映されない場合](#2-カレンダーに反映されない場合)
3. [トラブルシューティング](#3-トラブルシューティング)

---

## 1. メールが届かない場合

### 推奨: Brevo（課金不要・約5分で設定）

**Brevo** は無料で 300通/日 送信でき、クレジットカード登録不要です。

**最良の手順：**

1. [docs/BREVO_SETUP.md](BREVO_SETUP.md) に従って Brevo アカウント作成
2. 送信元メールアドレスを認証（認証メールのリンクをクリック）
3. API キーを取得して `.env` に設定
4. Vercel の場合は **Settings → Environment Variables** に同じ変数を追加
5. **Redeploy** を実行
6. `/email-test` でテスト送信

---

### 代替: Gmail SMTP（既存 Gmail で届く）

Gmail をお持ちなら、**アプリパスワード** だけで設定できます。ドメイン認証は不要です。

**手順：** [docs/SMTP_SETUP.md](SMTP_SETUP.md) を参照

---

### 代替: EmailJS（課金が発生する場合あり）

### 1-1. EmailJS アカウント作成（5分）

1. ブラウザで [https://www.emailjs.com/](https://www.emailjs.com/) を開く
2. **Sign Up** をクリック
3. メールアドレスとパスワードでアカウント作成
4. ログイン後、ダッシュボードが表示される

---

### 1-2. メールサービスを接続（Gmail の場合）

1. 左メニュー **Email Services** → **Add New Service**
2. **Gmail** を選択
3. **Connect Account** をクリック
4. Google アカウントでログインし、許可する
5. 接続後、**Service ID** をメモ（例: `service_tu929ag`）

> **Gmail で「アプリパスワード」を求められた場合**
> - Google アカウントで 2段階認証 を有効にする
> - [Google アカウント](https://myaccount.google.com/) → セキュリティ → 2段階認証
> - 「アプリパスワード」を生成し、そのパスワードを EmailJS に入力

---

### 1-3. テンプレートを作成（顧客用）

1. 左メニュー **Email Templates** → **Create New Template**
2. 以下を入力：

| 項目 | 入力内容 |
|------|----------|
| **Subject** | `【予約確認】ご予約のご案内` |
| **To Email** | `{{to_email}}` ← このまま入力（変数です） |
| **From Name** | `予約システム` など |
| **Content** | 下記をコピーして貼り付け |

**Content に貼り付ける本文：**

```
{{customer_name}} 様

予約のご確認です。

■ 予約内容
店舗: {{shop_name}}
メニュー: {{menu_name}}
日時: {{datetime}}
所要時間: {{duration}}分
料金: {{price}}円

前日18時までキャンセル可能です
キャンセルは以下のリンクから可能です：
{{cancel_url}}

よろしくお願いいたします。
```

3. **Save** をクリック
4. テンプレート一覧で **Template ID** をメモ（例: `template_k3bb7k5`）

---

### 1-4. テンプレートを作成（管理者用）

1. **Email Templates** → **Create New Template**
2. 以下を入力：

| 項目 | 入力内容 |
|------|----------|
| **Subject** | `【新規予約】予約がありました` |
| **To Email** | `{{to_email}}` |
| **Content** | 下記を貼り付け |

```
新規予約の通知です。

■ 予約内容
お名前: {{customer_name}}
メール: {{customer_email}}
店舗: {{shop_name}}
メニュー: {{menu_name}}
日時: {{datetime}}
所要時間: {{duration}}分
料金: {{price}}円
```

3. **Save** をクリック
4. **Template ID** をメモ

---

### 1-5. API キーを取得

1. 左メニュー **Account** → **API Keys**（または **Security**）
2. **Public Key** をコピー（例: `ZrJtBqMbw2GK3QEc2`）
3. **Private Key** をコピー（表示されていない場合は「Generate」で作成）

> **重要**: サーバーからメールを送るには **Private Key** と **API リクエストの許可** が必要です。

---

### 1-6. API リクエストを有効化（必須）

1. 左メニュー **Account** → **Security**
2. **Allow API requests from non-browser applications** を **ON** にする
3. 保存

> これを行わないと、サーバーからのメール送信がブロックされます。

---

### 1-7. 環境変数を設定

プロジェクトの `.env` ファイルを開き、以下を設定：

```bash
# EmailJS（メール送信）
NUXT_PUBLIC_EMAILJS_PUBLIC_KEY="ここに Public Key を貼り付け"
NUXT_PUBLIC_EMAILJS_SERVICE_ID="ここに Service ID を貼り付け"
NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER="ここに顧客用 Template ID を貼り付け"
NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN="ここに管理者用 Template ID を貼り付け"
NUXT_PUBLIC_ADMIN_EMAIL="管理者のメールアドレス（予約通知が届く先）"

# サーバー送信用（Private Key）
EMAILJS_PRIVATE_KEY="ここに Private Key を貼り付け"
```

**例：**

```bash
NUXT_PUBLIC_EMAILJS_PUBLIC_KEY="ZrJtBqMbw2GK3QEc2"
NUXT_PUBLIC_EMAILJS_SERVICE_ID="service_tu929ag"
NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER="template_k3bb7k5"
NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN="template_e5qskj4"
NUXT_PUBLIC_ADMIN_EMAIL="your-email@gmail.com"
EMAILJS_PRIVATE_KEY="xxxxxxxxxxxxxxxx"
```

---

### 1-8. アプリを再起動

```bash
# 開発サーバーを停止（Ctrl+C）してから
npm run dev
```

`.env` を変更したら、必ず再起動してください。

---

### 1-9. 動作確認

1. 予約を1件作成する
2. 顧客メールアドレスに送信されるか確認
3. 届かない場合は **迷惑メールフォルダ** を確認
4. [EmailJS ダッシュボード](https://dashboard.emailjs.com/) → **Email History** で送信履歴を確認

---

## 2. カレンダーに反映されない場合

### 2-1. カレンダー連携の仕組み

このシステムでは **2つの方法** でカレンダーに追加できます：

| 方法 | 説明 | 自動反映 |
|------|------|----------|
| **Googleカレンダーに追加** | クリックで Google カレンダーが開き、予約内容が自動入力される | 1 画面で「保存」を押す |
| **カレンダーに追加（.ics）** | .ics ファイルをダウンロードし、Outlook 等にインポート | 手動でインポート |

### 2-2. Googleカレンダーに追加（推奨）

1. 予約完了画面で **「Googleカレンダーに追加」** ボタンをクリック
2. 新しいタブで Google カレンダーが開く
3. 予約の日時・内容が自動入力されている
4. **「保存」** をクリックしてカレンダーに追加

> 「Googleカレンダーに追加」ボタンが表示されない場合は、アプリを再ビルドしてください：
> ```bash
> npm run build
> npm run dev
> ```

### 2-3. 完全に自動で反映するには（上級者向け）

Google カレンダーに **完全自動** で追加するには、Google Calendar API と OAuth の設定が必要です。手順は複雑なため、別途 [docs/CALENDAR_SETUP.md](CALENDAR_SETUP.md) を参照してください。

現状の「Googleカレンダーに追加」ボタンは、**1クリックで予約内容を入力した画面を開く**ため、あと1回「保存」を押すだけで追加できます。

---

## 3. トラブルシューティング

### メールが届かない

| 確認項目 | 対処 |
|----------|------|
| Brevo の送信元認証 | 認証メール内のリンクをクリックしたか確認 |
| Gmail のアプリパスワード | 通常パスワードではなく 16 文字のアプリパスワードを使用 |
| Vercel の環境変数 | 設定後は **Redeploy** が必要 |
| 迷惑メールフォルダ | Gmail の「プロモーション」「迷惑メール」を確認 |
| テスト送信 | `/email-test` で動作確認 |

### カレンダーボタンが表示されない

- `npm run build` 後に `npm run dev` で再起動
- ブラウザのキャッシュをクリア（Ctrl+Shift+R）

### その他

- **Brevo**: [docs/BREVO_SETUP.md](BREVO_SETUP.md)
- **Gmail SMTP**: [docs/SMTP_SETUP.md](SMTP_SETUP.md)
- **EmailJS**: [docs/EMAILJS_SETUP.md](EMAILJS_SETUP.md)（課金が発生する場合あり）
