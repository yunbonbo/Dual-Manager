<template>
  <main class="success-page">
    <div class="success-card">
      <h1 class="success-title">予約とお支払いが完了しました</h1>
      <p class="success-message">ありがとうございます。</p>

      <div v-if="loading" class="success-loading">読み込み中…</div>
      <div v-else-if="reservation" class="success-detail">
        <p>{{ reservation.shop_name }} / {{ reservation.menu_name }}</p>
        <p>{{ formatDateTime(reservation.start_at) }}</p>
      </div>

      <div class="success-actions">
        <button
          v-if="reservation"
          type="button"
          class="success-btn success-btn--secondary"
          @click="handleDownloadIcs"
        >
          カレンダーに追加（.ics）
        </button>
        <NuxtLink to="/" class="success-btn success-btn--primary">
          トップに戻る
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { downloadIcs } = useIcsDownload()
const { sendCustomerEmail, sendAdminEmail, isConfigured } = useReservationEmail()

const loading = ref(true)
const emailSent = ref(false)
const reservation = ref<{
  shop_name: string
  menu_name: string
  start_at: string
  end_at: string
} | null>(null)

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]}) ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

function handleDownloadIcs() {
  const r = reservation.value
  if (!r) return
  downloadIcs(
    {
      title: `予約: ${r.shop_name} - ${r.menu_name}`,
      startAt: new Date(r.start_at),
      endAt: new Date(r.end_at),
      location: r.shop_name
    },
    `reservation-${new Date(r.start_at).getFullYear()}${(new Date(r.start_at).getMonth() + 1).toString().padStart(2, "0")}${new Date(r.start_at).getDate().toString().padStart(2, "0")}.ics`
  )
}

onMounted(async () => {
  const sessionId = route.query.session_id as string
  if (!sessionId) {
    loading.value = false
    return
  }

  try {
    const data = await $fetch<{
      paid: boolean
      reservation: {
        id: string
        start_at: string
        end_at: string
        name: string
        shop_name: string
        menu_name: string
      } | null
    }>(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)

    if (data.reservation) {
      reservation.value = {
        shop_name: data.reservation.shop_name,
        menu_name: data.reservation.menu_name,
        start_at: data.reservation.start_at,
        end_at: data.reservation.end_at
      }

      // メール送信（初回のみ）
      if (isConfigured && !emailSent.value && data.paid) {
        emailSent.value = true
        const r = data.reservation
        const cancelUrl =
          typeof window !== "undefined" && r.cancel_token
            ? `${window.location.origin}/cancel?token=${r.cancel_token}`
            : ""
        await Promise.all([
          sendCustomerEmail({
            customerName: r.name,
            customerEmail: r.email,
            shopName: r.shop_name,
            menuName: r.menu_name,
            datetime: r.datetime,
            duration: r.duration,
            price: r.price,
            cancelUrl,
            status: "pending"
          }),
          sendAdminEmail({
            customerName: r.name,
            customerEmail: r.email,
            shopName: r.shop_name,
            menuName: r.menu_name,
            datetime: r.datetime,
            duration: r.duration,
            price: r.price
          })
        ])
      }
    }
  } catch (e) {
    console.error("[Dual-Manager] 予約情報の取得に失敗:", e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.success-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.success-title {
  font-size: 20px;
  color: #0d9488;
  margin-bottom: 8px;
}

.success-message {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.success-loading {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 24px;
}

.success-detail {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.success-btn {
  display: block;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  border: none;
  min-height: 44px;
}

.success-btn--primary {
  background: #0d9488;
  color: #fff;
}

.success-btn--primary:hover {
  background: #0f766e;
}

.success-btn--secondary {
  background: #f0fdfa;
  color: #0d9488;
  border: 1px solid #99f6e4;
}

.success-btn--secondary:hover {
  background: #ccfbf1;
}
</style>
