<template>
  <main class="login-page">
    <div class="login-card">
      <h1 class="login-title">管理者ログイン</h1>
      <p class="login-subtitle">ダッシュボードにアクセスするにはログインしてください</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div v-if="errorMessage" class="login-error">
          {{ errorMessage }}
        </div>

        <div class="form-field">
          <label for="email" class="form-label">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            required
            autocomplete="email"
            placeholder="admin@example.com"
          >
        </div>

        <div class="form-field">
          <label for="password" class="form-label">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            required
            autocomplete="current-password"
            placeholder="••••••••"
          >
        </div>

        <p class="form-hint">
          ログイン状態はブラウザに記憶されます（ログアウトするまで有効）
        </p>

        <button
          type="submit"
          class="login-button"
          :disabled="loading"
        >
          {{ loading ? "ログイン中…" : "ログイン" }}
        </button>
      </form>

      <NuxtLink to="/" class="login-back">
        ← 予約フォームに戻る
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ["auth"] })

const router = useRouter()
const { signIn, init } = useAuth()

const email = ref("")
const password = ref("")
const loading = ref(false)
const errorMessage = ref("")

onMounted(() => {
  init()
})

const handleSubmit = async () => {
  errorMessage.value = ""
  loading.value = true

  try {
    await signIn(email.value, password.value)
    await router.push("/dashboard")
  } catch (e: unknown) {
    const err = e as { message?: string }
    errorMessage.value =
      err?.message?.includes("Invalid login")
        ? "メールアドレスまたはパスワードが正しくありません。"
        : "ログインに失敗しました。しばらくしてから再度お試しください。"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-error {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #0d9488;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.login-button {
  padding: 12px 24px;
  background: #0d9488;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.login-button:hover:not(:disabled) {
  background: #0f766e;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-back {
  display: block;
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
}

.login-back:hover {
  color: #0d9488;
}
</style>
