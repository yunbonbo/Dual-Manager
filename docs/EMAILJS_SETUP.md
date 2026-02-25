# EmailJS メール通知 セットアップ手順

予約申込・確定・キャンセル時にメールを送信するには、EmailJS の設定が必要です。

---

## 1. EmailJS アカウント作成

1. [EmailJS](https://www.emailjs.com/) にアクセス
2. 無料アカウントを作成
3. ダッシュボードにログイン

---

## 2. メールサービスを追加

1. **Email Services** → **Add New Service**
2. 使用するメールサービス（Gmail、Outlook 等）を選択
3. 接続設定を完了
4. **Service ID** をメモ（例: `service_xxxxx`）

---

## 3. テンプレートを作成

EmailJS のテンプレート編集画面で、**各項目に以下をそのまま入力**してください。

---

### 顧客向けテンプレート（予約申込・確定・キャンセル共通）

**Email Templates** → **Create New Template** で新規作成

| EmailJS の項目            | 入力する値                                            |
| ------------------------- | ----------------------------------------------------- |
| **Subject**（件名）       | `【Dual-Manager】予約のご案内`                        |
| **To Email**（送信先）    | `{{to_email}}` ← **必ずこのまま**。固定アドレスにすると届きません |
| **From Name**（差出人名） | `Dual-Manager` など（固定で OK）                      |
| **From Email**            | 「Use Default Email Address」にチェック               |
| **Reply To**（返信先）    | 空欄、または管理者メール                              |
| **Content**（本文）       | 下記をコピーして貼り付け                              |

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

{{cancel_deadline_text}}
キャンセルは以下のリンクから可能です：
{{cancel_url}}

よろしくお願いいたします。
```

※ **Edit Content** をクリックして、上記を貼り付けてください。

**Template ID の確認方法**: テンプレート保存後、テンプレート一覧または編集画面の URL に表示されます（例: `template_abc123`）

---

### 管理者向けテンプレート（新規予約通知）

**Email Templates** → **Create New Template** で新規作成

| EmailJS の項目            | 入力する値                                           |
| ------------------------- | ---------------------------------------------------- |
| **Subject**（件名）       | `【Dual-Manager】新規予約がありました`               |
| **To Email**（送信先）    | `{{to_email}}` ← .env の管理者メールが自動で入ります |
| **From Name**（差出人名） | `Dual-Manager` など（固定で OK）                     |
| **From Email**            | 「Use Default Email Address」にチェック              |
| **Reply To**              | 空欄で OK                                            |
| **Content**（本文）       | 下記をコピーして貼り付け                             |

**Content に貼り付ける本文：**

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

**Template ID** をメモ（例: `template_yyyyy`）

---

### 入力のポイント

- **To Email** に `{{to_email}}` と入力すると、アプリ側で指定したメールアドレスに送信されます
- **Content** 内の `{{customer_name}}` などは、予約データに応じて自動で置き換わります
- 変数名は**必ず上記の通り**にしてください（`customer_name` など、アンダースコア付き）

---

## 4. 環境変数を設定

`.env` に以下を追加：

```bash
# EmailJS
NUXT_PUBLIC_EMAILJS_PUBLIC_KEY="your_public_key"
NUXT_PUBLIC_EMAILJS_SERVICE_ID="your_service_id"
NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER="your_customer_template_id"
NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN="your_admin_template_id"
NUXT_PUBLIC_ADMIN_EMAIL="admin@example.com"

# サーバー送信用（メールが届きやすくなる・推奨）
EMAILJS_PRIVATE_KEY="your_private_key"
```

- **Public Key**: EmailJS ダッシュボード → **Account** → **API Keys**
- **Private Key**: 同上。サーバーから送信する場合に必須。取得後、**Account → Security** で「Allow API requests from non-browser applications」を ON にすること
- **Service ID**: 手順 2 でメモした値
- **Template IDs**: 手順 3 でメモした値（顧客用・管理者用）
- **Admin Email**: 管理者のメールアドレス

---

## 「The recipients address is corrupted」(422) エラーが出る場合

- **To Email** が `{{to_email}}` になっているか確認（余分なスペースや文字がないか）
- メールアドレスに不可視文字（BOM 等）が含まれていないか
- `.env` の `NUXT_PUBLIC_ADMIN_EMAIL` を再入力して保存し直す

---

## メールが届かない場合の確認ポイント

1. **ブラウザのコンソールを確認**

   - 開発モード（`npm run dev`）で予約を実行
   - F12 → Console タブで `[Dual-Manager]` のログを確認
   - 「顧客メール送信成功」「管理者メール送信成功」が出ていれば EmailJS 側では送信済み
   - 「EmailJS 顧客送信エラー」が出ている場合は、エラー内容を確認

2. **EmailJS ダッシュボードで送信履歴を確認**

   - [EmailJS](https://dashboard.emailjs.com/) → **Email History**
   - 送信成功・失敗・エラー内容を確認できる

3. **テンプレートの To Email を確認**

   - 顧客用・管理者用ともに **To Email** が `{{to_email}}` になっているか
   - 固定アドレスや誤字があると届かない

4. **Email Service の接続を確認**

   - **Email Services** で Gmail 等が正しく接続されているか
   - 無料プランの Gmail は「アプリパスワード」が必要な場合がある

5. **迷惑メールフォルダを確認**

   - 届いていない場合は迷惑メール・プロモーションタブも確認

6. **環境変数の反映**
   - `.env` を変更したら `npm run dev` を再起動する

---

## 5. テンプレート変数一覧

| 変数名         | 説明                               |
| -------------- | ---------------------------------- |
| to_email       | 送信先メールアドレス               |
| customer_name  | 顧客名                             |
| customer_email | 顧客メールアドレス                 |
| shop_name      | 店舗名                             |
| menu_name      | メニュー名                         |
| datetime       | 予約日時                           |
| duration       | 所要時間（分）                     |
| price          | 料金（円）                         |
| cancel_url          | キャンセル用 URL（予約申込時のみ）       |
| cancel_deadline_text| キャンセル期限の文言（デフォルト: 前日18時までキャンセル可能です） |
| status              | pending / confirmed / cancelled          |

---

## 6. サーバー送信を有効にする（メールが届きやすくなる）

クライアント（ブラウザ）からの送信だと、タブを閉じるなどで失敗することがあります。サーバー送信に切り替えると確実です。

1. EmailJS ダッシュボード → **Account** → **Security**
2. **Allow API requests from non-browser applications** を **ON** にする
3. **API Keys** で **Private Key** を取得（なければ Generate）
4. `.env` に `EMAILJS_PRIVATE_KEY="..."` を追加
5. `npm run dev` を再起動

---

## 注意事項

- EmailJS の無料プランには送信数制限があります
- 設定が未完了の場合、メール送信はスキップされ、予約・キャンセル処理は正常に完了します
