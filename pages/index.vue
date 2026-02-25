<template>
  <main class="page">
    <section class="page-inner">
      <div class="page-header">
        <NuxtLink to="/dashboard" class="admin-link">管理者</NuxtLink>
      </div>
      <!-- 前のページに戻るボタン（ステップ2・3のみ表示、成功時は非表示） -->
      <div v-if="currentStep > 1 && currentStep < 4" class="back-button-wrap">
        <button
          type="button"
          class="back-button"
          @click="handleBack"
        >
          ← 前のページに戻る
        </button>
      </div>

      <!-- ステップナビ（成功時は非表示） -->
      <nav v-if="currentStep < 4" class="stepper">
        <div
          class="step"
          :class="{
            'step--active': currentStep === 1,
            'step--completed': currentStep > 1
          }"
        >
          <span class="step__index">
            <template v-if="currentStep > 1">✓</template>
            <template v-else>1</template>
          </span>
          <span class="step__label">メニュー</span>
        </div>
        <div
          class="step"
          :class="{
            'step--active': currentStep === 2,
            'step--completed': currentStep > 2
          }"
        >
          <span class="step__index">
            <template v-if="currentStep > 2">✓</template>
            <template v-else>2</template>
          </span>
          <span class="step__label">日時</span>
        </div>
        <div class="step" :class="{ 'step--active': currentStep === 3 }">
          <span class="step__index">3</span>
          <span class="step__label">情報入力</span>
        </div>
      </nav>

      <!-- ステップ1: 店舗・メニュー選択 -->
      <template v-if="currentStep === 1">
        <!-- 店舗を選択 -->
        <section class="block">
          <h2 class="block__title">店舗を選択</h2>

          <!-- ローディング -->
          <div v-if="pending" class="center-text muted">読み込み中です…</div>

          <!-- エラー表示 -->
          <div v-else-if="error" class="alert">
            店舗情報の取得中にエラーが発生しました。時間をおいて再度お試しください。
          </div>

          <!-- 店舗ボタン -->
          <div v-else class="shop-grid">
            <button
              v-for="shop in shops"
              :key="shop.id"
              type="button"
              class="shop-card"
              :class="{ 'shop-card--active': selectedShopId === shop.id }"
              @click="handleSelectShop(shop.id)"
            >
              <div class="shop-card__icon">
                <img
                  :src="getShopImage(shop.name)"
                  :alt="shop.name"
                  class="shop-card__icon-img"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                >
              </div>
              <p class="shop-card__name">
                {{ shop.name }}
              </p>
            </button>

            <p v-if="shops.length === 0" class="center-text muted">
              店舗情報が登録されていません。Supabase の
              <span class="strong">shops</span>
              テーブルに店舗を追加してください。
            </p>
          </div>
        </section>

        <!-- メニューを選択 -->
        <section class="block">
          <h2 class="block__title">メニューを選択</h2>

          <div v-if="filteredMenus.length === 0" class="center-text muted">
            この店舗にはメニューが登録されていません。
          </div>

          <div v-else class="menu-list">
            <article
              v-for="menu in filteredMenus"
              :key="menu.id"
              class="menu-card"
              :class="{ 'menu-card--active': selectedMenuId === menu.id }"
              @click="handleSelectMenu(menu.id)"
            >
              <div class="menu-card__icon">
                <img
                  :src="getMenuImage(menu)"
                  :alt="menu.name"
                  class="menu-card__icon-img"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                >
              </div>
              <div class="menu-card__info">
                <p class="menu-card__name">
                  {{ menu.name }}
                </p>
                <p class="menu-card__meta">
                  <span>{{ menu.duration }}分</span>
                  <span>¥{{ menu.price.toLocaleString() }}</span>
                </p>
              </div>
            </article>
          </div>
        </section>

        <!-- フッターボタン（次へ：日時を選ぶ） -->
        <footer class="footer">
          <button type="button" class="footer__button" @click="handleNextStep">
            次へ：日時を選ぶ
          </button>
        </footer>
      </template>

      <!-- ステップ2: 日時選択 -->
      <template v-else-if="currentStep === 2">
        <!-- 日付を選択 -->
        <section class="block">
          <h2 class="block__title">日付を選択</h2>

          <div class="calendar">
            <!-- 月のナビゲーション -->
            <div class="calendar__header">
              <button
                type="button"
                class="calendar__nav"
                @click="previousMonth"
              >
                ←
              </button>
              <p class="calendar__month">
                {{ currentMonth.getFullYear() }}年
                {{ currentMonth.getMonth() + 1 }}月
              </p>
              <button type="button" class="calendar__nav" @click="nextMonth">
                →
              </button>
            </div>

            <!-- 曜日ヘッダー -->
            <div class="calendar__weekdays">
              <div
                v-for="day in weekdays"
                :key="day"
                class="calendar__weekday"
                :class="{
                  'calendar__weekday--weekend': day === '日' || day === '土'
                }"
              >
                {{ day }}
              </div>
            </div>

            <!-- カレンダーグリッド -->
            <div class="calendar__grid">
              <button
                v-for="date in calendarDates"
                :key="date.key"
                type="button"
                class="calendar__date"
                :class="{
                  'calendar__date--other-month': date.isOtherMonth,
                  'calendar__date--disabled': !date.isSelectable,
                  'calendar__date--selected': date.isSelected
                }"
                :disabled="!date.isSelectable"
                @click="handleSelectDate(date.date)"
              >
                {{ date.day }}
              </button>
            </div>
          </div>
        </section>

        <!-- 時間を選択 -->
        <section class="block">
          <h2 class="block__title">時間を選択</h2>

          <div v-if="!selectedDate" class="center-text muted">
            まず日付を選択してください。
          </div>

          <div v-else class="time-grid">
            <button
              v-for="timeSlot in availableTimeSlots"
              :key="timeSlot.value"
              type="button"
              class="time-button"
              :class="{
                'time-button--selected': selectedTime === timeSlot.value,
                'time-button--disabled': !timeSlot.isAvailable
              }"
              :disabled="!timeSlot.isAvailable"
              @click="handleSelectTime(timeSlot.value)"
            >
              {{ timeSlot.label }}
            </button>
          </div>
        </section>

        <!-- フッターボタン（次へ：情報入力） -->
        <footer class="footer">
          <button
            type="button"
            class="footer__button"
            @click="handleNextToStep3"
          >
            次へ：情報入力
          </button>
        </footer>
      </template>

      <!-- ステップ3: 情報入力 -->
      <template v-else-if="currentStep === 3">
        <!-- お客様情報を入力 -->
        <section class="block">
          <h2 class="block__title">お客様情報を入力</h2>

          <div class="form">
            <!-- お名前 -->
            <div class="form__field">
              <label class="form__label">お名前</label>
              <input
                v-model="formData.name"
                type="text"
                class="form__input"
                placeholder="山田 太郎"
              />
            </div>

            <!-- フリガナ -->
            <div class="form__field">
              <label class="form__label">フリガナ</label>
              <input
                v-model="formData.name_kana"
                type="text"
                class="form__input"
                placeholder="ヤマダ タロウ"
              />
            </div>

            <!-- 電話番号 -->
            <div class="form__field">
              <label class="form__label">電話番号</label>
              <input
                v-model="formData.tel"
                type="tel"
                class="form__input"
                placeholder="090-1234-5678"
              />
            </div>

            <!-- メールアドレス -->
            <div class="form__field">
              <label class="form__label">メールアドレス</label>
              <input
                v-model="formData.email"
                type="email"
                class="form__input"
                placeholder="yamada@example.com"
              />
            </div>

            <!-- 事前支払い（Stripe 設定時のみ表示） -->
            <div v-if="stripeEnabled" class="form__field form__field--checkbox">
              <label class="form__label form__label--checkbox">
                <input
                  v-model="paymentInAdvance"
                  type="checkbox"
                  class="form__checkbox"
                />
                事前にカードで支払う（¥{{ selectedMenuPrice?.toLocaleString() }}）
              </label>
            </div>

            <!-- 任意項目（アコーディオン） -->
            <div class="accordion">
              <button
                type="button"
                class="accordion__header"
                @click="toggleOptionalFields"
              >
                <span>任意項目（タップして開く）</span>
                <span class="accordion__icon">{{
                  showOptionalFields ? "▼" : "▶"
                }}</span>
              </button>

              <div v-if="showOptionalFields" class="accordion__content">
                <!-- 性別 -->
                <div class="form__field">
                  <label class="form__label">性別</label>
                  <select v-model="formData.gender" class="form__input">
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <!-- 誕生日 -->
                <div class="form__field">
                  <label class="form__label">誕生日</label>
                  <div class="birthday-selects">
                    <select
                      v-model="formData.birthday_year"
                      class="form__input form__input--birthday"
                    >
                      <option value="">年</option>
                      <option
                        v-for="year in availableYears"
                        :key="year"
                        :value="year"
                      >
                        {{ year }}年
                      </option>
                    </select>
                    <select
                      v-model="formData.birthday_month"
                      class="form__input form__input--birthday"
                    >
                      <option value="">月</option>
                      <option v-for="month in 12" :key="month" :value="month">
                        {{ month }}月
                      </option>
                    </select>
                    <select
                      v-model="formData.birthday_day"
                      class="form__input form__input--birthday"
                    >
                      <option value="">日</option>
                      <option
                        v-for="day in availableDays"
                        :key="day"
                        :value="day"
                      >
                        {{ day }}日
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 予約内容の確認 -->
        <section class="block block--confirm">
          <h2 class="block__title block__title--confirm">予約内容の確認</h2>

          <div class="confirm-list">
            <div class="confirm-item">
              <span class="confirm-item__label">店舗</span>
              <span class="confirm-item__value">{{ selectedShopName }}</span>
            </div>
            <div class="confirm-item">
              <span class="confirm-item__label">メニュー</span>
              <span class="confirm-item__value">{{ selectedMenuName }}</span>
            </div>
            <div class="confirm-item">
              <span class="confirm-item__label">日時</span>
              <span class="confirm-item__value">{{ formattedDateTime }}</span>
            </div>
            <div class="confirm-item">
              <span class="confirm-item__label">所要時間</span>
              <span class="confirm-item__value"
                >{{ selectedMenuDuration }}分</span
              >
            </div>
            <div class="confirm-item confirm-item--total">
              <span class="confirm-item__label">合計金額</span>
              <span class="confirm-item__value confirm-item__value--price">
                ¥{{ selectedMenuPrice?.toLocaleString() }}
              </span>
            </div>
          </div>
        </section>

        <!-- フッターボタン（予約を確定する） -->
        <footer class="footer">
          <button
            type="button"
            class="footer__button footer__button--confirm"
            :disabled="isSubmitting || !isFormValid"
            @click="handleSubmitReservation"
          >
            <span v-if="isSubmitting">送信中...</span>
            <span v-else>予約を確定する</span>
          </button>
        </footer>
      </template>

      <!-- ステップ4: 予約完了 -->
      <template v-else-if="currentStep === 4">
        <section class="block block--success">
          <h2 class="block__title block__title--success">ご予約が完了しました</h2>
          <p class="success-message">
            メールへ予約詳細を送信しました。そちらより前日までのキャンセルも可能です。ご来店お待ちしております。
          </p>
          <div v-if="lastReservation" class="success-detail">
            <p>{{ lastReservation.shopName }} / {{ lastReservation.menuName }}</p>
            <p>{{ lastReservation.datetime }}</p>
          </div>
          <div class="success-actions">
            <p class="success-actions__hint">
              開いた画面で「保存」を押すとカレンダーに追加されます
            </p>
            <button
              type="button"
              class="footer__button"
              @click="handleAddToGoogleCalendar"
            >
              Googleカレンダーに追加
            </button>
            <button
              type="button"
              class="footer__button footer__button--secondary"
              @click="handleDownloadIcs"
            >
              その他のカレンダー用（.ics）
            </button>
            <button
              type="button"
              class="footer__button"
              @click="handleBackToTop"
            >
              トップに戻る
            </button>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"

type Shop = {
  id: string
  name: string
  color: string | null
}

type Menu = {
  id: string
  shop_id: string
  name: string
  duration: number
  price: number
  display_order?: number
}

const { supabase } = useSupabase()
const { downloadIcs, openGoogleCalendar } = useIcsDownload()
const { minHours, fetch: fetchMinHours, getMinBookingTimestamp } =
  useMinHoursSetting()
const { fetchForCalendarView: fetchClosedDates, isClosed } = useClosedDates()
const {
  fetchForCalendarView: fetchOpenDates,
  isOpen
} = useOpenDates()
const { fetch: fetchClosedDayRules, matchesRule } = useClosedDayRules()

const shops = ref<Shop[]>([])
const menus = ref<Menu[]>([])

const currentStep = ref(1)
const selectedShopId = ref<string | null>(null)
const selectedMenuId = ref<string | null>(null)
const selectedDate = ref<Date | null>(null)
const selectedTime = ref<string | null>(null)

const pending = ref(false)
const error = ref<string | null>(null)

// 予約済み時間のグレーアウト用：選択中の日付・店舗の既存予約
const reservationsForSelectedDate = ref<
  Array<{ start_at: string; end_at: string; status: string }>
>([])

// フォームデータ
const formData = ref({
  name: "",
  name_kana: "",
  tel: "",
  email: "",
  gender: "",
  birthday_year: "",
  birthday_month: "",
  birthday_day: ""
})

const showOptionalFields = ref(false)
const isSubmitting = ref(false)
const paymentInAdvance = ref(false)

const config = useRuntimeConfig()
const stripeEnabled = computed(() => !!config.public?.stripeEnabled)

// 予約完了後の表示用（ステップ4）
const lastReservation = ref<{
  shopName: string
  menuName: string
  datetime: string
  startAt: Date
  endAt: Date
  cancelUrl?: string
} | null>(null)

// カレンダー用
const currentMonth = ref(new Date())
const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

// 営業時間: 9:00〜18:00、最終受付17:00
const BUSINESS_START_HOUR = 9
const BUSINESS_END_HOUR = 18
const LAST_ACCEPTANCE_HOUR = 17
const TIME_SLOT_INTERVAL = 15 // 15分刻み

const filteredMenus = computed(() => {
  if (!selectedShopId.value) return []
  return menus.value
    .filter((menu) => menu.shop_id === selectedShopId.value)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
})

const selectedMenu = computed(() => {
  if (!selectedMenuId.value) return null
  return menus.value.find((menu) => menu.id === selectedMenuId.value) ?? null
})

// 予約内容確認用の computed
const selectedShopName = computed(() => {
  if (!selectedShopId.value) return ""
  return (
    shops.value.find((shop) => shop.id === selectedShopId.value)?.name ?? ""
  )
})

const selectedMenuName = computed(() => {
  return selectedMenu.value?.name ?? ""
})

const selectedMenuDuration = computed(() => {
  return selectedMenu.value?.duration ?? 0
})

const selectedMenuPrice = computed(() => {
  return selectedMenu.value?.price ?? 0
})

const formattedDateTime = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return ""

  const date = new Date(selectedDate.value)
  const [hours, minutes] = selectedTime.value.split(":").map(Number)
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  const time = selectedTime.value

  return `${month}/${day} (${weekday}) ${time}`
})

// 誕生日選択用の computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  // 1900年から現在年まで
  for (let year = currentYear; year >= 1900; year--) {
    years.push(year)
  }
  return years
})

const availableDays = computed(() => {
  const year = formData.value.birthday_year
  const month = formData.value.birthday_month

  if (!year || !month) return []

  // 選択された年月の最終日を取得
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const days: number[] = []
  for (let day = 1; day <= lastDay; day++) {
    days.push(day)
  }
  return days
})

// フォームバリデーション
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== "" &&
    formData.value.name_kana.trim() !== "" &&
    formData.value.tel.trim() !== "" &&
    formData.value.email.trim() !== ""
  )
})

// カレンダーの日付一覧を生成
const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  // 月の最初の日と最後の日
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // カレンダー表示の開始日（前月の最後の週の日曜日から）
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const dates: Array<{
    key: string
    date: Date
    day: number
    isOtherMonth: boolean
    isSelectable: boolean
    isSelected: boolean
  }> = []

  // 6週分（42日）を生成
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const isOtherMonth = date.getMonth() !== month
    const isSelectable = isDateSelectable(date)
    const isSelected = Boolean(
      selectedDate.value &&
        date.toDateString() === selectedDate.value.toDateString()
    )

    dates.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      day: date.getDate(),
      isOtherMonth,
      isSelectable,
      isSelected
    })
  }

  return dates
})

// 日付が選択可能かチェック（定休日・臨時休業日・猶予時間内は不可）
function isDateSelectable(date: Date): boolean {
  // 過去の日付は選択不可
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate < today) return false

  // 定休日ルールに該当し、かつ臨時営業でない場合は選択不可
  const dateStr = date.toISOString().slice(0, 10)
  if (matchesRule(date) && !isOpen(dateStr)) return false

  // 臨時休業日は選択不可
  if (isClosed(dateStr)) return false

  // 猶予時間チェック：その日の最終スロット（17:00）が「今からN時間後」より前なら
  // 全時間帯が予約不可なので日付も選択不可
  const lastSlotStart = new Date(date)
  lastSlotStart.setHours(LAST_ACCEPTANCE_HOUR, 0, 0, 0)
  const minBookingTs = getMinBookingTimestamp()
  if (lastSlotStart.getTime() < minBookingTs) return false

  return true
}

// 利用可能な時間スロットを生成（15分刻み、9:00〜17:00）
const availableTimeSlots = computed(() => {
  if (!selectedDate.value || !selectedMenu.value) return []

  const now = new Date()

  // キャンセル以外の既存予約（時間重複チェック用）
  const activeReservations = reservationsForSelectedDate.value.filter(
    (r) => r.status !== "cancelled"
  )

  const slots: Array<{
    value: string
    label: string
    isAvailable: boolean
  }> = []

  // 9:00 から 17:00 まで15分刻みで生成
  for (let hour = BUSINESS_START_HOUR; hour <= LAST_ACCEPTANCE_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`

      const slotStart = new Date(selectedDate.value)
      const [startHour, startMinute] = timeString.split(":").map(Number)
      slotStart.setHours(startHour ?? 0, startMinute ?? 0, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(
        slotEnd.getMinutes() + (selectedMenu.value?.duration ?? 0)
      )

      // 終了時刻が営業時間内か
      let isAvailable = slotEnd.getHours() <= BUSINESS_END_HOUR

      // 全日付共通：最低猶予時間（例: 48時間前まで）をチェック
      // 予約開始時刻が「今からN時間後」より前なら選択不可
      if (isAvailable) {
        const minBookingTs = getMinBookingTimestamp()
        if (slotStart.getTime() < minBookingTs) {
          isAvailable = false
        }
      }

      // 既存予約との重複チェック
      if (isAvailable) {
        for (const res of activeReservations) {
          const resStart = new Date(res.start_at)
          const resEnd = new Date(res.end_at)
          if (slotStart < resEnd && slotEnd > resStart) {
            isAvailable = false
            break
          }
        }
      }

      slots.push({
        value: timeString,
        label: timeString,
        isAvailable
      })
    }
  }

  return slots
})

onMounted(async () => {
  if (!supabase) {
    error.value = "Supabase の設定が正しくありません。"
    pending.value = false
    return
  }

  pending.value = true
  error.value = null

  try {
    const [shopsResult, menusResult] = await Promise.all([
      supabase
        .from("shops")
        .select("id, name, color")
        .order("name", { ascending: true }),
      supabase
        .from("menus")
        .select("id, shop_id, name, duration, price, display_order")
        .order("display_order", { ascending: true, nullsFirst: false })
    ])

    if (shopsResult.error) {
      console.error("[Dual-Manager] Failed to fetch shops:", shopsResult.error)
      throw shopsResult.error
    }
    if (menusResult.error) {
      console.error("[Dual-Manager] Failed to fetch menus:", menusResult.error)
      throw menusResult.error
    }

    shops.value = shopsResult.data ?? []
    menus.value = menusResult.data ?? []

    await fetchMinHours()

    if (!selectedShopId.value && shops.value.length > 0 && shops.value[0]) {
      selectedShopId.value = shops.value[0].id
    }
  } catch (e) {
    error.value = "failed"
  } finally {
    pending.value = false
  }
})

// 日付を選択したときに settings を再取得（最新の猶予時間を反映）
watch(
  selectedDate,
  async (date) => {
    if (!date || !supabase) return
    await fetchMinHours()
  }
)

// カレンダー表示月が変わったときに休業日・営業日データを取得
watch(
  [() => currentStep.value, currentMonth],
  async ([step, month]) => {
    if (step !== 2 || !month) return
    const m = month as Date
    await fetchClosedDayRules()
    await fetchClosedDates(m.getFullYear(), m.getMonth() + 1)
    await fetchOpenDates(m.getFullYear(), m.getMonth() + 1)
  },
  { immediate: true }
)

// 日付・店舗が変わったら、その日の既存予約を取得（予約済み時間のグレーアウト用）
watch(
  [selectedDate, selectedShopId],
  async ([date, shopId]) => {
    if (!supabase || !date || !shopId) {
      reservationsForSelectedDate.value = []
      return
    }
    const d = date as Date
    const startOfDay = new Date(d)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(d)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from("reservations")
      .select("start_at, end_at, status")
      .eq("shop_id", shopId)
      .gte("start_at", startOfDay.toISOString())
      .lte("start_at", endOfDay.toISOString())

    reservationsForSelectedDate.value = (data ?? []) as Array<{
      start_at: string
      end_at: string
      status: string
    }>
  },
  { immediate: true }
)

// 店舗カード用の画像パス（理容室→owner_man01, 美容室→owner_female01）
const getShopImage = (shopName: string) => {
  const map: Record<string, string> = {
    理容室: "/images/owner_man01.png",
    美容室: "/images/owner_female01.png"
  }
  return map[shopName] ?? `/images/shop-${shopName}.png`
}

// メニューカード用の画像パス（理容室のメニュー→model_man03, 美容室のメニュー→model_female02）
const getMenuImage = (menu: { shop_id: string }) => {
  const shop = shops.value.find((s) => s.id === menu.shop_id)
  const map: Record<string, string> = {
    理容室: "/images/model_man03.png",
    美容室: "/images/model_female02.png"
  }
  return shop ? (map[shop.name] ?? "/images/menu-default.png") : "/images/menu-default.png"
}

const handleSelectShop = (shopId: string) => {
  selectedShopId.value = shopId
  selectedMenuId.value = null
}

const handleSelectMenu = (menuId: string) => {
  selectedMenuId.value = menuId
}

const handleNextStep = () => {
  if (!selectedShopId.value || !selectedMenuId.value) {
    alert("店舗とメニューを選択してください。")
    return
  }

  currentStep.value = 2
  // カレンダーを今日の月にリセット
  currentMonth.value = new Date()
  selectedDate.value = null
  selectedTime.value = null
}

const previousMonth = () => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentMonth.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentMonth.value = newDate
}

const handleSelectDate = (date: Date) => {
  if (!isDateSelectable(date)) return
  selectedDate.value = new Date(date)
  selectedTime.value = null // 日付変更時は時間をリセット
}

const handleSelectTime = (time: string) => {
  const slot = availableTimeSlots.value.find((s) => s.value === time)
  if (!slot?.isAvailable) return
  selectedTime.value = time
}

const handleNextToStep3 = () => {
  if (!selectedDate.value || !selectedTime.value) {
    alert("日付と時間を選択してください。")
    return
  }
  const slot = availableTimeSlots.value.find(
    (s) => s.value === selectedTime.value
  )
  if (!slot?.isAvailable) {
    alert("選択された時間は現在予約できません。別の時間を選んでください。")
    selectedTime.value = null
    return
  }

  currentStep.value = 3
}

const handleBack = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1
    selectedDate.value = null
    selectedTime.value = null
  } else if (currentStep.value === 3) {
    currentStep.value = 2
  }
}

const toggleOptionalFields = () => {
  showOptionalFields.value = !showOptionalFields.value
}

// 年や月が変更されたときに、選択された日が新しい月の最終日を超える場合は日をリセット
watch(
  [() => formData.value.birthday_year, () => formData.value.birthday_month],
  () => {
    const year = formData.value.birthday_year
    const month = formData.value.birthday_month
    const day = formData.value.birthday_day

    if (year && month && day) {
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      if (Number(day) > lastDay) {
        formData.value.birthday_day = ""
      }
    }
  }
)

const handleSubmitReservation = async () => {
  if (!supabase) {
    alert("Supabase の設定が正しくありません。")
    return
  }

  if (!isFormValid.value) {
    alert("必須項目をすべて入力してください。")
    return
  }

  if (
    !selectedShopId.value ||
    !selectedMenuId.value ||
    !selectedDate.value ||
    !selectedTime.value
  ) {
    alert("予約情報が不完全です。最初からやり直してください。")
    return
  }

  isSubmitting.value = true

  try {
    // 開始日時と終了日時を計算
    const startAt = new Date(selectedDate.value)
    const [hours, minutes] = selectedTime.value.split(":").map(Number)
    startAt.setHours(hours ?? 0, minutes ?? 0, 0, 0)

    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + (selectedMenu.value?.duration ?? 0))

    // 誕生日を YYYY-MM-DD 形式に結合（年・月・日がすべて入力されている場合のみ）
    const birthday =
      formData.value.birthday_year &&
      formData.value.birthday_month &&
      formData.value.birthday_day
        ? `${formData.value.birthday_year}-${String(
            formData.value.birthday_month
          ).padStart(2, "0")}-${String(formData.value.birthday_day).padStart(
            2,
            "0"
          )}`
        : null

    // 事前支払い（Stripe）の場合
    if (paymentInAdvance.value && stripeEnabled.value) {
      const res = await $fetch<{ url: string }>("/api/stripe/create-checkout", {
        method: "POST",
        body: {
          shop_id: selectedShopId.value,
          menu_id: selectedMenuId.value,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          name: formData.value.name.trim(),
          name_kana: formData.value.name_kana.trim(),
          tel: formData.value.tel.trim(),
          email: formData.value.email.trim(),
          gender: formData.value.gender || null,
          birthday,
          shop_name: selectedShopName.value,
          menu_name: selectedMenuName.value,
          price: selectedMenuPrice.value ?? 0
        }
      })
      if (res?.url) {
        window.location.href = res.url
        return
      }
    }

    const cancelToken = crypto.randomUUID()

    // Supabase に予約を保存
    const { data, error: insertError } = await supabase
      .from("reservations")
      .insert({
        shop_id: selectedShopId.value,
        menu_id: selectedMenuId.value,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        name: formData.value.name.trim(),
        name_kana: formData.value.name_kana.trim(),
        tel: formData.value.tel.trim(),
        email: formData.value.email.trim(),
        gender: formData.value.gender || null,
        birthday: birthday,
        admin_memo: "",
        status: "pending",
        cancel_token: cancelToken
      })
      .select()

    if (insertError) {
      console.error("[Dual-Manager] Failed to create reservation:", insertError)
      alert(
        "予約の保存中にエラーが発生しました。時間をおいて再度お試しください。"
      )
      return
    }

    // メール送信（EmailJS 設定時のみ・サーバー経由で確実に届く）
    const { sendReservationEmailsViaServer, isConfigured } =
      useReservationEmail()
    const shopName = selectedShopName.value
    const menuName = selectedMenuName.value
    const duration = selectedMenuDuration.value
    const price = selectedMenuPrice.value
    const datetime = formattedDateTime.value

    if (import.meta.dev) {
      console.log("[Dual-Manager] メール送信 isConfigured:", isConfigured)
    }
    if (isConfigured) {
      const cancelUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/cancel?token=${cancelToken}`
          : ""
      await sendReservationEmailsViaServer({
        customerName: formData.value.name.trim(),
        customerEmail: formData.value.email.trim(),
        shopName,
        menuName,
        datetime,
        duration,
        price,
        cancelUrl,
        status: "pending"
      })
    }

    // 予約完了画面（ステップ4）へ
    const cancelUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/cancel?token=${cancelToken}`
        : ""
    lastReservation.value = {
      shopName,
      menuName,
      datetime,
      startAt: new Date(selectedDate.value!.getFullYear(), selectedDate.value!.getMonth(), selectedDate.value!.getDate(), parseInt(selectedTime.value!.split(":")[0], 10), parseInt(selectedTime.value!.split(":")[1], 10)),
      endAt: new Date(selectedDate.value!.getFullYear(), selectedDate.value!.getMonth(), selectedDate.value!.getDate(), parseInt(selectedTime.value!.split(":")[0], 10), parseInt(selectedTime.value!.split(":")[1], 10) + duration),
      cancelUrl: cancelUrl || undefined
    }
    currentStep.value = 4
  } catch (e) {
    console.error("[Dual-Manager] Unexpected error:", e)
    alert("予期しないエラーが発生しました。時間をおいて再度お試しください。")
  } finally {
    isSubmitting.value = false
  }
}

function handleAddToGoogleCalendar() {
  const r = lastReservation.value
  if (!r) return
  const title = `予約: ${r.shopName} - ${r.menuName}`
  const desc = r.cancelUrl
    ? `キャンセルはこちら: ${r.cancelUrl}`
    : undefined
  openGoogleCalendar({
    title,
    startAt: r.startAt,
    endAt: r.endAt,
    description: desc,
    location: r.shopName
  })
}

function handleDownloadIcs() {
  const r = lastReservation.value
  if (!r) return
  const title = `予約: ${r.shopName} - ${r.menuName}`
  const desc = r.cancelUrl
    ? `キャンセルはこちら: ${r.cancelUrl}`
    : undefined
  downloadIcs(
    {
      title,
      startAt: r.startAt,
      endAt: r.endAt,
      description: desc,
      location: r.shopName
    },
    `reservation-${r.startAt.getFullYear()}${(r.startAt.getMonth() + 1).toString().padStart(2, "0")}${r.startAt.getDate().toString().padStart(2, "0")}.ics`
  )
}

function handleBackToTop() {
  lastReservation.value = null
  formData.value = {
    name: "",
    name_kana: "",
    tel: "",
    email: "",
    gender: "",
    birthday_year: "",
    birthday_month: "",
    birthday_day: ""
  }
  selectedShopId.value = null
  selectedMenuId.value = null
  selectedDate.value = null
  selectedTime.value = null
  currentStep.value = 1
  showOptionalFields.value = false
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
}

.page-inner {
  width: 100%;
  max-width: 420px;
  padding: 24px 16px 32px;
}

.page-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.admin-link {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: none;
}

.admin-link:hover {
  color: #0d9488;
}

.back-button-wrap {
  margin-bottom: 16px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  min-height: 44px;
}

.back-button:hover {
  color: #0d9488;
}

.stepper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.step {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.step--active {
  color: #0d9488;
  font-weight: 600;
}

.step--completed {
  color: #10b981;
}

.step__index {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.block {
  margin-bottom: 24px;
}

.block__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.center-text {
  text-align: center;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.strong {
  font-weight: 600;
}

.alert {
  font-size: 13px;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 10px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.shop-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.shop-card--active {
  border-color: #0d9488;
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15);
}

.shop-card__icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #e5f3ff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-card__icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.shop-card__name {
  font-size: 13px;
  font-weight: 600;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
}

.menu-card--active {
  border-color: #facc15;
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2);
}

.menu-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #fef3c7;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-card__icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.menu-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.menu-card__name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.menu-card__meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 12px;
}

.footer {
  position: sticky;
  bottom: 0;
  margin-top: 24px;
}

.footer__button {
  width: 100%;
  border-radius: 10px;
  border: none;
  padding: 14px 16px;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* カレンダー */
.calendar {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
}

.calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar__month {
  font-size: 16px;
  font-weight: 600;
}

.calendar__nav {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
}

.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar__weekday {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  padding: 4px;
}

.calendar__weekday--weekend {
  color: #ef4444;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar__date {
  aspect-ratio: 1;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #1f2937;
  transition: all 0.2s;
}

.calendar__date:hover:not(:disabled) {
  background: #f3f4f6;
}

.calendar__date--other-month {
  color: #d1d5db;
}

.calendar__date--disabled {
  color: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}

.calendar__date--selected {
  background: #0d9488;
  color: #ffffff;
  font-weight: 600;
}

.calendar__date--selected:hover {
  background: #0f766e;
}

/* 時間選択 */
.time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.time-button {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1f2937;
}

.time-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.time-button--selected {
  background: #facc15;
  border-color: #facc15;
  color: #1f2937;
  font-weight: 600;
}

.time-button--disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* フォーム */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.form__input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  background: #ffffff;
  color: #1f2937;
  transition: border-color 0.2s;
}

.form__input:focus {
  outline: none;
  border-color: #0d9488;
}

.form__input::placeholder {
  color: #9ca3af;
}

.form__field--checkbox {
  flex-direction: row;
  align-items: center;
}

.form__label--checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.form__checkbox {
  width: 18px;
  height: 18px;
}

/* 誕生日選択 */
.birthday-selects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.form__input--birthday {
  padding: 10px 8px;
  font-size: 14px;
}

/* アコーディオン */
.accordion {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.accordion__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: background 0.2s;
}

.accordion__header:hover {
  background: #f9fafb;
}

.accordion__icon {
  font-size: 10px;
  color: #9ca3af;
}

.accordion__content {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 予約確認セクション */
.block--confirm {
  background: #e0f2fe;
  border-radius: 12px;
  padding: 16px;
}

.block__title--confirm {
  color: #0369a1;
  margin-bottom: 16px;
}

.confirm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(3, 105, 161, 0.1);
}

.confirm-item:last-child {
  border-bottom: none;
}

.confirm-item--total {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 2px solid rgba(3, 105, 161, 0.2);
  border-bottom: none;
  font-weight: 600;
}

.confirm-item__label {
  font-size: 14px;
  color: #0369a1;
}

.confirm-item__value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.confirm-item__value--price {
  font-size: 18px;
  color: #f59e0b;
  font-weight: 700;
}

/* フッターボタン（確定用） */
.footer__button--confirm {
  background: #f59e0b;
}

.footer__button--confirm:hover:not(:disabled) {
  background: #d97706;
}

.footer__button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.footer__button--secondary {
  background: #f0fdfa;
  color: #0d9488;
  border: 1px solid #99f6e4;
}

.footer__button--secondary:hover {
  background: #ccfbf1;
}

/* 予約完了画面 */
.block--success {
  text-align: center;
  padding: 32px 16px;
}

.block__title--success {
  font-size: 20px;
  color: #0d9488;
  margin-bottom: 8px;
}

.success-message {
  font-size: 16px;
  color: #6b7280;
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

.success-actions__hint {
  font-size: 12px;
  color: #9ca3af;
  margin: -4px 0 0;
}
</style>
