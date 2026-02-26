<template>
  <main class="email-test-page">
    <div class="email-test-card">
      <h1>メール送信テスト</h1>
      <p v-if="!isConfigured" class="email-test__error">
        メール送信が設定されていません。.env または Vercel の環境変数を確認してください。
      </p>
      <template v-else>
        <p class="email-test__status">設定: 有効</p>
        <form class="email-test__form" @submit.prevent="handleSend">
          <input
            v-model="testEmail"
            type="email"
            placeholder="テスト送信先のメールアドレス"
            class="email-test__input"
            required
          />
          <button type="submit" class="email-test__btn" :disabled="sending">
            {{ sending ? "送信中..." : "テストメールを送信" }}
          </button>
        </form>
        <p v-if="result" :class="result.ok ? 'email-test__success' : 'email-test__error'">
          {{ result.message }}
        </p>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { sendReservationEmailsViaServer, isConfigured } = useReservationEmail()
const testEmail = ref("")
const sending = ref(false)
const result = ref<{ ok: boolean; message: string } | null>(null)

async function handleSend() {
  if (!sending.value && testEmail.value) {
    sending.value = true
    result.value = null
    try {
      const res = await sendReservationEmailsViaServer({
        customerName: "テスト",
        customerEmail: testEmail.value,
        shopName: "テスト店舗",
        menuName: "テストメニュー",
        datetime: "テスト日時",
        duration: 30,
        price: 1000
      })
      result.value = res.ok
        ? { ok: true, message: "送信しました。迷惑メールフォルダも確認してください。" }
        : { ok: false, message: res.message ?? "送信に失敗しました。" }
    } catch (e) {
      result.value = { ok: false, message: `エラー: ${String(e)}` }
    } finally {
      sending.value = false
    }
  }
}
</script>

<style scoped>
.email-test-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.email-test-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
}

.email-test-card h1 {
  font-size: 20px;
  color: #0d9488;
  margin-bottom: 16px;
}

.email-test__status {
  color: #6b7280;
  margin-bottom: 16px;
}

.email-test__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email-test__input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.email-test__btn {
  padding: 12px 24px;
  background: #0d9488;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.email-test__btn:hover:not(:disabled) {
  background: #0f766e;
}

.email-test__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-test__success {
  font-size: 14px;
  color: #059669;
  margin-top: 16px;
}

.email-test__error {
  font-size: 14px;
  color: #dc2626;
  margin-top: 16px;
}
</style>
