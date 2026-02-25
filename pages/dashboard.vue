<template>
  <main class="dashboard">
    <div class="back-button-wrap dashboard-nav">
      <NuxtLink to="/" class="back-button"> ← 予約フォーム </NuxtLink>
      <button type="button" class="logout-button" @click="handleLogout">
        ログアウト
      </button>
    </div>

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
      <!-- 予約設定（管理者用） -->
      <section class="settings-section">
        <h2 class="settings-section__title">予約設定</h2>
        <div class="settings-row">
          <label class="settings-label">
            当日予約の最低猶予時間（時間）：
            <span class="settings-hint"
              >例: 3 = 予約時刻の3時間前までに申し込み可能</span
            >
          </label>
          <div class="settings-input-wrap">
            <input
              v-model.number="minHours"
              type="number"
              min="0"
              max="168"
              class="settings-input"
              @change="handleSaveMinHours"
            />
            <span class="settings-unit">時間</span>
            <button
              type="button"
              class="settings-reload-btn"
              :disabled="pending"
              @click="fetchData"
            >
              設定を再読み込み
            </button>
          </div>
        </div>
      </section>

      <!-- 定休日ルール -->
      <section class="settings-section">
        <h2 class="settings-section__title">定休日ルール</h2>
        <p class="settings-hint" style="margin-bottom: 12px;">
          毎週または第N週の曜日を定休日に設定。追加・削除が可能です。
        </p>
        <div class="closed-rules-list">
          <div
            v-for="rule in closedDayRules"
            :key="rule.id"
            class="closed-rule-item"
          >
            <span>{{ ruleLabel(rule) }}</span>
            <button
              type="button"
              class="closed-rule-remove"
              @click="handleRemoveRule(rule.id)"
            >
              削除
            </button>
          </div>
        </div>
        <div class="closed-rule-add">
          <select v-model="newRuleWeekday" class="closed-rule-select">
            <option
              v-for="(label, k) in weekdayLabels"
              :key="k"
              :value="Number(k)"
            >
              {{ label }}
            </option>
          </select>
          <select v-model="newRuleWeekOfMonth" class="closed-rule-select">
            <option value="">毎週</option>
            <option
              v-for="(label, k) in weekLabels"
              :key="k"
              :value="Number(k)"
            >
              {{ label }}
            </option>
          </select>
          <button
            type="button"
            class="closed-rule-add-btn"
            @click="handleAddRule"
          >
            追加
          </button>
        </div>
      </section>

      <!-- 休業日・営業日カレンダー -->
      <section class="settings-section closed-dates-section">
        <h2 class="settings-section__title">休業日・営業日の設定</h2>
        <p class="settings-hint" style="margin-bottom: 12px;">
          日付をクリックで切り替え：定休日→臨時営業、通常営業→臨時休業
        </p>
        <div class="closed-calendar">
          <div class="closed-calendar__header">
            <button
              type="button"
              class="closed-calendar__nav"
              @click="closedCalPrevMonth"
            >
              ←
            </button>
            <p class="closed-calendar__month">
              {{ closedCalMonth.getFullYear() }}年
              {{ closedCalMonth.getMonth() + 1 }}月
            </p>
            <button
              type="button"
              class="closed-calendar__nav"
              @click="closedCalNextMonth"
            >
              →
            </button>
          </div>
          <div class="closed-calendar__weekdays">
            <div
              v-for="d in ['日','月','火','水','木','金','土']"
              :key="d"
              class="closed-calendar__weekday"
            >
              {{ d }}
            </div>
          </div>
          <div class="closed-calendar__grid">
            <button
              v-for="cell in closedCalDates"
              :key="cell.key"
              type="button"
              class="closed-calendar__date"
              :class="{
                'closed-calendar__date--other': cell.isOtherMonth,
                'closed-calendar__date--regular': cell.isRegularClosed,
                'closed-calendar__date--temp-closed': cell.isTempClosed,
                'closed-calendar__date--temp-open': cell.isTempOpen
              }"
              :disabled="cell.isOtherMonth"
              :title="cell.title"
              @click="handleCalendarDateClick(cell)"
            >
              {{ cell.day }}
            </button>
          </div>
        </div>
      </section>

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

            <!-- 予約状態変更・カレンダー -->
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
              <button
                type="button"
                class="reservation-card__ics-btn"
                title="Googleカレンダーに追加"
                @click="handleAddToGoogleCalendar(reservation)"
              >
                Google
              </button>
              <button
                type="button"
                class="reservation-card__ics-btn"
                title="カレンダーに追加（.ics）"
                @click="handleDownloadIcs(reservation)"
              >
                .ics
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] })

import { computed, onMounted, ref } from "vue"

type Shop = {
  id: string
  name: string
  color: string | null
}

type Menu = {
  id: string
  name: string
  duration?: number
  price?: number
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

const router = useRouter()
const { supabase } = useSupabase()
const { signOut } = useAuth()
const { downloadIcs, openGoogleCalendar } = useIcsDownload()
const {
  minHours,
  fetch: fetchMinHours,
  save: saveMinHours
} = useMinHoursSetting()
const {
  fetchForMonth: fetchClosedDates,
  fetchForCalendarView: fetchClosedForCalendar,
  toggle: toggleClosedDate,
  isClosed
} = useClosedDates()
const {
  fetchForMonth: fetchOpenDates,
  fetchForCalendarView: fetchOpenForCalendar,
  toggle: toggleOpenDate,
  isOpen
} = useOpenDates()
const {
  rules: closedDayRules,
  fetch: fetchClosedDayRules,
  add: addClosedDayRule,
  remove: removeClosedDayRule,
  matchesRule,
  weekdayLabels,
  weekLabels,
  ruleLabel
} = useClosedDayRules()

const newRuleWeekday = ref(1)
const newRuleWeekOfMonth = ref<number | string>( "")
const closedCalMonth = ref(new Date())
const closedCalDates = computed(() => {
  const year = closedCalMonth.value.getFullYear()
  const month = closedCalMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const cells: Array<{
    key: string
    date: Date
    day: number
    isOtherMonth: boolean
    isRegularClosed: boolean
    isTempClosed: boolean
    isTempOpen: boolean
    dateStr: string
    title: string
  }> = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)
    const isOtherMonth = date.getMonth() !== month
    const matchesClosedRule = matchesRule(date)
    const inOpenDates = isOpen(dateStr)
    const inClosedDates = isClosed(dateStr)
    const isRegularClosed = matchesClosedRule && !inOpenDates
    const isTempClosed = inClosedDates
    const isTempOpen = matchesClosedRule && inOpenDates

    let title = ""
    if (isRegularClosed) title = "定休日（クリックで臨時営業に変更）"
    else if (isTempOpen) title = "臨時営業（クリックで定休に戻す）"
    else if (isTempClosed) title = "臨時休業（クリックで解除）"
    else title = "通常営業（クリックで臨時休業に追加）"

    cells.push({
      key: dateStr,
      date,
      day: date.getDate(),
      isOtherMonth,
      isRegularClosed,
      isTempClosed,
      isTempOpen,
      dateStr,
      title
    })
  }
  return cells
})

function closedCalPrevMonth() {
  const d = new Date(closedCalMonth.value)
  d.setMonth(d.getMonth() - 1)
  closedCalMonth.value = d
  fetchClosedForCalendar(d.getFullYear(), d.getMonth() + 1)
  fetchOpenForCalendar(d.getFullYear(), d.getMonth() + 1)
}

function closedCalNextMonth() {
  const d = new Date(closedCalMonth.value)
  d.setMonth(d.getMonth() + 1)
  closedCalMonth.value = d
  fetchClosedForCalendar(d.getFullYear(), d.getMonth() + 1)
  fetchOpenForCalendar(d.getFullYear(), d.getMonth() + 1)
}

async function handleCalendarDateClick(
  cell: (typeof closedCalDates.value)[number]
) {
  if (cell.isOtherMonth) return
  if (cell.isRegularClosed) {
    await toggleOpenDate(cell.dateStr)
  } else if (cell.isTempOpen) {
    await toggleOpenDate(cell.dateStr)
  } else if (cell.isTempClosed) {
    await toggleClosedDate(cell.dateStr)
  } else {
    await toggleClosedDate(cell.dateStr)
  }
}

async function handleAddRule() {
  const week =
    newRuleWeekOfMonth.value === "" || newRuleWeekOfMonth.value === null
      ? null
      : Number(newRuleWeekOfMonth.value)
  await addClosedDayRule(newRuleWeekday.value, week)
}

async function handleRemoveRule(id: string) {
  await removeClosedDayRule(id)
}

const handleLogout = async () => {
  await signOut()
  await router.push("/login")
}

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

// メニュー情報を取得（duration, price 用）
const getMenu = (menuId: string) => {
  return menus.value.find((m) => m.id === menuId)
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

// Googleカレンダーに追加
const handleAddToGoogleCalendar = (reservation: Reservation) => {
  const startAt = new Date(reservation.start_at)
  const endAt = new Date(reservation.end_at)
  const shopName = getShopName(reservation.shop_id)
  const menuName = getMenuName(reservation.menu_id)
  openGoogleCalendar({
    title: `予約: ${shopName} - ${menuName}`,
    startAt,
    endAt,
    description: `${reservation.name} 様`,
    location: shopName
  })
}

// .ics ダウンロード（カレンダーに追加）
const handleDownloadIcs = (reservation: Reservation) => {
  const startAt = new Date(reservation.start_at)
  const endAt = new Date(reservation.end_at)
  const shopName = getShopName(reservation.shop_id)
  const menuName = getMenuName(reservation.menu_id)
  downloadIcs(
    {
      title: `予約: ${shopName} - ${menuName}`,
      startAt,
      endAt,
      description: `${reservation.name} 様`,
      location: shopName
    },
    `reservation-${startAt.getFullYear()}${(startAt.getMonth() + 1).toString().padStart(2, "0")}${startAt.getDate().toString().padStart(2, "0")}.ics`
  )
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

    // 確定・キャンセル時に顧客へメール送信
    if (newStatus === "confirmed" || newStatus === "cancelled") {
      const { sendCustomerEmail, isConfigured } = useReservationEmail()
      if (isConfigured && reservation) {
        const menu = getMenu(reservation.menu_id)
        const startAt = new Date(reservation.start_at)
        const endAt = new Date(reservation.end_at)
        const duration = menu?.duration ?? Math.round((endAt.getTime() - startAt.getTime()) / 60000)
        const price = menu?.price ?? 0
        await sendCustomerEmail({
          customerName: reservation.name,
          customerEmail: reservation.email,
          shopName: getShopName(reservation.shop_id),
          menuName: getMenuName(reservation.menu_id),
          datetime: formatDateTime(reservation.start_at),
          duration,
          price,
          status: newStatus as "confirmed" | "cancelled"
        })
      }
    }
  } catch (e) {
    console.error("[Dual-Manager] Unexpected error:", e)
    alert("予期しないエラーが発生しました。")
  }
}

const handleSaveMinHours = () => saveMinHours(minHours.value)

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
      supabase.from("menus").select("id, name, duration, price").order("name"),
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

    await fetchMinHours()
    await fetchClosedDayRules()
    await fetchClosedForCalendar(
      closedCalMonth.value.getFullYear(),
      closedCalMonth.value.getMonth() + 1
    )
    await fetchOpenForCalendar(
      closedCalMonth.value.getFullYear(),
      closedCalMonth.value.getMonth() + 1
    )
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

.back-button-wrap {
  margin-bottom: 16px;
}

.dashboard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-button {
  padding: 8px 12px;
  font-size: 14px;
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.logout-button:hover {
  color: #b91c1c;
  border-color: #fecaca;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  min-height: 44px;
}

.back-button:hover {
  color: #0d9488;
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

/* 予約設定 */
.settings-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
}

.settings-section__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
}

.settings-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-label {
  font-size: 14px;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-hint {
  font-size: 12px;
  color: #6b7280;
  font-weight: normal;
}

.settings-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-input {
  width: 80px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
}

.settings-unit {
  font-size: 14px;
  color: #6b7280;
}

.settings-reload-btn {
  margin-left: 8px;
  padding: 6px 12px;
  font-size: 13px;
  color: #0d9488;
  background: transparent;
  border: 1px solid #0d9488;
  border-radius: 6px;
  cursor: pointer;
}

.settings-reload-btn:hover:not(:disabled) {
  background: #0d9488;
  color: #fff;
}

.settings-reload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 臨時休業日カレンダー */
.closed-dates-section .closed-calendar {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.closed-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.closed-calendar__month {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.closed-calendar__nav {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
}

.closed-calendar__nav:hover {
  color: #0d9488;
}

.closed-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.closed-calendar__weekday {
  text-align: center;
  font-size: 11px;
  color: #6b7280;
}

.closed-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.closed-calendar__date {
  aspect-ratio: 1;
  border: none;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #1f2937;
  transition: all 0.2s;
}

.closed-calendar__date:hover:not(:disabled) {
  background: #e5e7eb;
}

.closed-calendar__date--other {
  background: transparent;
  color: #d1d5db;
  cursor: default;
}

.closed-calendar__date--regular {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.closed-calendar__date--temp-closed {
  background: #fecaca;
  color: #b91c1c;
}

.closed-calendar__date--temp-closed:hover {
  background: #fca5a5;
}

.closed-calendar__date--temp-open {
  background: #bbf7d0;
  color: #15803d;
}

.closed-calendar__date--temp-open:hover {
  background: #86efac;
}

/* 定休日ルール */
.closed-rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.closed-rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.closed-rule-remove {
  padding: 4px 8px;
  font-size: 12px;
  color: #b91c1c;
  background: transparent;
  border: 1px solid #fecaca;
  border-radius: 4px;
  cursor: pointer;
}

.closed-rule-remove:hover {
  background: #fef2f2;
}

.closed-rule-add {
  display: flex;
  gap: 8px;
  align-items: center;
}

.closed-rule-select {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.closed-rule-add-btn {
  padding: 6px 12px;
  font-size: 14px;
  color: #fff;
  background: #0d9488;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.closed-rule-add-btn:hover {
  background: #0f766e;
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
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.reservation-card__ics-btn {
  padding: 6px 10px;
  font-size: 12px;
  color: #0d9488;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 6px;
  cursor: pointer;
}

.reservation-card__ics-btn:hover {
  background: #ccfbf1;
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
