<template>
  <main class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">予約管理ダッシュボード</h1>
      <p class="dashboard__subtitle">2店舗の予約を時系列で確認・管理</p>
    </header>

    <!-- ローディング -->
    <div v-if="pending" class="dashboard__loading">読み込み中です…</div>

    <!-- エラー表示 -->
    <div v-else-if="error" class="dashboard__error">
      予約情報の取得中にエラーが発生しました。時間をおいて再度お試しください。
    </div>

    <!-- 予約一覧 -->
    <div v-else class="dashboard__content">
      <!-- フィルター（店舗・状態） -->
      <div class="filters">
        <select v-model="filterShopId" class="filter-select">
          <option value="">全店舗</option>
          <option v-for="shop in shops" :key="shop.id" :value="shop.id">
            {{ shop.name }}
          </option>
        </select>

        <select v-model="filterStatus" class="filter-select">
          <option value="">全状態</option>
          <option value="pending">予約待ち</option>
          <option value="confirmed">確定</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      <!-- 予約リスト -->
      <div v-if="filteredReservations.length === 0" class="dashboard__empty">
        予約がありません。
      </div>

      <div v-else class="reservation-list">
        <article
          v-for="reservation in filteredReservations"
          :key="reservation.id"
          class="reservation-card"
          :style="{
            borderLeftColor: getShopColor(reservation.shop_id) || '#e5e7eb'
          }"
        >
          <!-- 予約ヘッダー -->
          <div class="reservation-card__header">
            <div class="reservation-card__info">
              <span
                class="reservation-card__shop"
                :style="{
                  color: getShopColor(reservation.shop_id) || '#6b7280'
                }"
              >
                {{ getShopName(reservation.shop_id) }}
              </span>
              <span
                class="reservation-card__status"
                :class="`reservation-card__status--${reservation.status}`"
              >
                {{ getStatusLabel(reservation.status) }}
              </span>
            </div>
            <div class="reservation-card__datetime">
              {{ formatDateTime(reservation.start_at) }}
            </div>
          </div>

          <!-- 予約詳細 -->
          <div class="reservation-card__body">
            <div class="reservation-card__detail">
              <p class="reservation-card__menu">
                {{ getMenuName(reservation.menu_id) }}
              </p>
              <p class="reservation-card__customer">
                {{ reservation.name }} 様
                <span v-if="reservation.tel" class="reservation-card__tel">
                  ({{ reservation.tel }})
                </span>
              </p>
              <p v-if="reservation.email" class="reservation-card__email">
                {{ reservation.email }}
              </p>
            </div>

            <!-- 管理者メモ -->
            <div class="reservation-card__memo">
              <label class="reservation-card__memo-label">管理者メモ</label>
              <textarea
                v-model="reservation.admin_memo"
                class="reservation-card__memo-input"
                placeholder="メモを入力..."
                @blur="handleUpdateMemo(reservation.id, reservation.admin_memo)"
              />
            </div>

            <!-- 予約状態変更 -->
            <div class="reservation-card__actions">
              <select
                :value="reservation.status"
                class="reservation-card__status-select"
                @change="
                  handleUpdateStatus(
                    reservation.id,
                    ($event.target as HTMLSelectElement).value
                  )
                "
              >
                <option value="pending">予約待ち</option>
                <option value="confirmed">確定</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { createClient } from "@supabase/supabase-js"
import { computed, onMounted, ref } from "vue"

type Shop = {
  id: string
  name: string
  color: string | null
}

type Menu = {
  id: string
  name: string
}

type Reservation = {
  id: string
  shop_id: string
  menu_id: string
  start_at: string
  end_at: string
  name: string
  name_kana: string
  tel: string
  email: string
  gender: string | null
  birthday: string | null
  admin_memo: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
}

const config = useRuntimeConfig()

const supabaseUrl = config.public?.supabaseUrl || ""
const supabaseAnonKey = config.public?.supabaseAnonKey || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Dual-Manager] Supabase の URL または anon key が設定されていません。"
  )
}

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

const shops = ref<Shop[]>([])
const menus = ref<Menu[]>([])
const reservations = ref<Reservation[]>([])

const filterShopId = ref<string>("")
const filterStatus = ref<string>("")

const pending = ref(false)
const error = ref<string | null>(null)

// フィルター適用後の予約一覧
const filteredReservations = computed(() => {
  let filtered = [...reservations.value]

  // 店舗でフィルター
  if (filterShopId.value) {
    filtered = filtered.filter((r) => r.shop_id === filterShopId.value)
  }

  // 状態でフィルター
  if (filterStatus.value) {
    filtered = filtered.filter((r) => r.status === filterStatus.value)
  }

  // 時系列でソート（開始日時の昇順）
  return filtered.sort((a, b) => {
    return new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  })
})

// 店舗名を取得
const getShopName = (shopId: string) => {
  return shops.value.find((s) => s.id === shopId)?.name ?? "不明"
}

// 店舗の色を取得
const getShopColor = (shopId: string) => {
  return shops.value.find((s) => s.id === shopId)?.color ?? null
}

// メニュー名を取得
const getMenuName = (menuId: string) => {
  return menus.value.find((m) => m.id === menuId)?.name ?? "不明"
}

// 状態のラベルを取得
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "予約待ち",
    confirmed: "確定",
    cancelled: "キャンセル"
  }
  return labels[status] ?? status
}

// 日時をフォーマット
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  const weekday = weekdays[date.getDay()]

  return `${month}/${day} (${weekday}) ${hours}:${minutes}`
}

// 管理者メモを更新
const handleUpdateMemo = async (reservationId: string, memo: string) => {
  if (!supabase) {
    alert("Supabase の設定が正しくありません。")
    return
  }

  try {
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ admin_memo: memo })
      .eq("id", reservationId)

    if (updateError) {
      console.error("[Dual-Manager] Failed to update memo:", updateError)
      alert("メモの更新に失敗しました。")
      return
    }
  } catch (e) {
    console.error("[Dual-Manager] Unexpected error:", e)
    alert("予期しないエラーが発生しました。")
  }
}

// 予約状態を更新
const handleUpdateStatus = async (reservationId: string, newStatus: string) => {
  if (!supabase) {
    alert("Supabase の設定が正しくありません。")
    return
  }

  try {
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", reservationId)

    if (updateError) {
      console.error("[Dual-Manager] Failed to update status:", updateError)
      alert("状態の更新に失敗しました。")
      return
    }

    // ローカル状態も更新
    const reservation = reservations.value.find((r) => r.id === reservationId)
    if (reservation) {
      reservation.status = newStatus as "pending" | "confirmed" | "cancelled"
    }
  } catch (e) {
    console.error("[Dual-Manager] Unexpected error:", e)
    alert("予期しないエラーが発生しました。")
  }
}

// データを取得
const fetchData = async () => {
  if (!supabase) {
    error.value = "Supabase の設定が正しくありません。"
    pending.value = false
    return
  }

  pending.value = true
  error.value = null

  try {
    const [shopsResult, menusResult, reservationsResult] = await Promise.all([
      supabase.from("shops").select("id, name, color").order("name"),
      supabase.from("menus").select("id, name").order("name"),
      supabase
        .from("reservations")
        .select("*")
        .order("start_at", { ascending: true })
    ])

    if (shopsResult.error) {
      console.error("[Dual-Manager] Failed to fetch shops:", shopsResult.error)
      throw shopsResult.error
    }
    if (menusResult.error) {
      console.error("[Dual-Manager] Failed to fetch menus:", menusResult.error)
      throw menusResult.error
    }
    if (reservationsResult.error) {
      console.error(
        "[Dual-Manager] Failed to fetch reservations:",
        reservationsResult.error
      )
      throw reservationsResult.error
    }

    shops.value = shopsResult.data ?? []
    menus.value = menusResult.data ?? []
    reservations.value = (reservationsResult.data ?? []) as Reservation[]
  } catch (e) {
    error.value = "failed"
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 16px;
}

.dashboard__header {
  margin-bottom: 24px;
}

.dashboard__title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.dashboard__subtitle {
  font-size: 14px;
  color: #6b7280;
}

.dashboard__loading,
.dashboard__error,
.dashboard__empty {
  text-align: center;
  padding: 48px 16px;
  color: #6b7280;
  font-size: 14px;
}

.dashboard__error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.dashboard__content {
  max-width: 800px;
  margin: 0 auto;
}

/* フィルター */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-select {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #0d9488;
}

/* 予約リスト */
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reservation-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #e5e7eb;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.reservation-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.reservation-card__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reservation-card__shop {
  font-size: 14px;
  font-weight: 600;
}

.reservation-card__status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.reservation-card__status--pending {
  background: #fef3c7;
  color: #92400e;
}

.reservation-card__status--confirmed {
  background: #d1fae5;
  color: #065f46;
}

.reservation-card__status--cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.reservation-card__datetime {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.reservation-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservation-card__detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reservation-card__menu {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.reservation-card__customer {
  font-size: 14px;
  color: #374151;
}

.reservation-card__tel {
  font-size: 13px;
  color: #6b7280;
}

.reservation-card__email {
  font-size: 13px;
  color: #6b7280;
}

.reservation-card__memo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservation-card__memo-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.reservation-card__memo-input {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  color: #1f2937;
  transition: border-color 0.2s;
}

.reservation-card__memo-input:focus {
  outline: none;
  border-color: #0d9488;
}

.reservation-card__actions {
  display: flex;
  justify-content: flex-end;
}

.reservation-card__status-select {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
}

.reservation-card__status-select:focus {
  outline: none;
  border-color: #0d9488;
}
</style>
