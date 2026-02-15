<template>
  <main class="cancel-page">
    <div class="cancel-card">
      <h1 class="cancel-title">予約のキャンセル</h1>

      <div v-if="loading" class="cancel-loading">読み込み中…</div>

      <div v-else-if="error" class="cancel-error">
        {{ error }}
      </div>

      <div v-else-if="reservation" class="cancel-content">
        <p class="cancel-intro">
          以下の予約をキャンセルしますか？
        </p>

        <dl class="cancel-detail">
          <dt>店舗</dt>
          <dd>{{ reservation.shop_name }}</dd>
          <dt>メニュー</dt>
          <dd>{{ reservation.menu_name }}</dd>
          <dt>日時</dt>
          <dd>{{ formatDateTime(reservation.start_at) }}</dd>
          <dt>お名前</dt>
          <dd>{{ reservation.name }} 様</dd>
        </dl>

        <div v-if="reservation.status === 'cancelled'" class="cancel-already">
          この予約は既にキャンセルされています。
        </div>

        <div v-else class="cancel-actions">
          <button
            type="button"
            class="cancel-btn cancel-btn--primary"
            :disabled="isSubmitting"
            @click="handleCancel"
          >
            {{ isSubmitting ? "キャンセル処理中…" : "予約をキャンセルする" }}
          </button>
          <NuxtLink to="/" class="cancel-link">予約フォームに戻る</NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { supabase } = useSupabase()
const { sendCustomerEmail, isConfigured } = useReservationEmail()

const token = computed(() => String(route.query.token || ""))

type ReservationWithNames = {
  id: string
  shop_id: string
  menu_id: string
  start_at: string
  end_at: string
  name: string
  name_kana: string
  email: string
  status: string
  shop_name: string
  menu_name: string
}

const reservation = ref<ReservationWithNames | null>(null)
const loading = ref(true)
const error = ref("")
const isSubmitting = ref(false)

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]}) ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

async function fetchReservation() {
  if (!token.value || !supabase) {
    error.value = "キャンセル用のリンクが正しくありません。"
    loading.value = false
    return
  }

  const { data: resData, error: fetchError } = await supabase
    .from("reservations")
    .select("id, shop_id, menu_id, start_at, end_at, name, name_kana, email, status")
    .eq("cancel_token", token.value)
    .maybeSingle()

  if (fetchError || !resData) {
    error.value = "予約が見つかりません。リンクが無効か、期限切れの可能性があります。"
    loading.value = false
    return
  }

  const r = resData as {
    id: string
    shop_id: string
    menu_id: string
    start_at: string
    end_at: string
    name: string
    name_kana: string
    email: string
    status: string
  }

  const [shopRes, menuRes] = await Promise.all([
    supabase.from("shops").select("name").eq("id", r.shop_id).single(),
    supabase.from("menus").select("name").eq("id", r.menu_id).single()
  ])

  reservation.value = {
    ...r,
    shop_name: (shopRes.data as { name?: string } | null)?.name ?? "不明",
    menu_name: (menuRes.data as { name?: string } | null)?.name ?? "不明"
  }
  loading.value = false
}

async function handleCancel() {
  if (!reservation.value || !supabase) return
  if (reservation.value.status === "cancelled") return

  isSubmitting.value = true
  try {
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.value.id)

    if (updateError) throw updateError

    reservation.value.status = "cancelled"

    if (isConfigured) {
      const startAt = new Date(reservation.value.start_at)
      const endAt = new Date(reservation.value.end_at)
      const duration = Math.round(
        (endAt.getTime() - startAt.getTime()) / 60000
      )
      await sendCustomerEmail({
        customerName: reservation.value.name,
        customerEmail: reservation.value.email,
        shopName: reservation.value.shop_name,
        menuName: reservation.value.menu_name,
        datetime: formatDateTime(reservation.value.start_at),
        duration,
        price: 0,
        status: "cancelled"
      })
    }

    alert("予約をキャンセルしました。")
  } catch (e) {
    console.error("[Dual-Manager] Cancel error:", e)
    alert("キャンセル処理に失敗しました。時間をおいて再度お試しください。")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchReservation()
})
</script>

<style scoped>
.cancel-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.cancel-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.cancel-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
}

.cancel-loading,
.cancel-error {
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

.cancel-error {
  color: #b91c1c;
  background: #fef2f2;
  border-radius: 8px;
}

.cancel-intro {
  margin-bottom: 20px;
  color: #374151;
  font-size: 14px;
}

.cancel-detail {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px 16px;
  margin-bottom: 24px;
  font-size: 14px;
}

.cancel-detail dt {
  color: #6b7280;
}

.cancel-detail dd {
  margin: 0;
  color: #1f2937;
}

.cancel-already {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 24px;
}

.cancel-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-btn {
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}

.cancel-btn--primary {
  background: #b91c1c;
  color: #fff;
}

.cancel-btn--primary:hover:not(:disabled) {
  background: #991b1b;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-link {
  text-align: center;
  font-size: 14px;
  color: #0d9488;
  text-decoration: none;
}

.cancel-link:hover {
  text-decoration: underline;
}
</style>
