const SETTINGS_KEY = "min_hours_before_booking"
const DEFAULT_HOURS = 3
const MAX_HOURS = 168 // 最大7日（168時間）

/**
 * 当日予約の最低猶予時間（時間）を管理する composable
 * 例: 3 = 予約時刻の3時間前までに申し込み可能
 */
export function useMinHoursSetting() {
  const { supabase } = useSupabase()
  const minHours = ref(DEFAULT_HOURS)

  async function fetch() {
    if (!supabase) return
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle()

    if (error) {
      console.warn("[Dual-Manager] settings 取得エラー:", error.message)
      return
    }
    if (data?.value) {
      const val = parseInt(String(data.value).trim(), 10)
      if (!Number.isNaN(val) && val >= 0) {
        minHours.value = Math.min(MAX_HOURS, val)
      }
    }
  }

  async function save(value: number) {
    if (!supabase) return
    const val = Math.max(0, Math.min(MAX_HOURS, value))
    minHours.value = val
    await supabase
      .from("settings")
      .upsert({ key: SETTINGS_KEY, value: String(val) }, { onConflict: "key" })
  }

  /** 猶予時間を考慮した「予約可能な最小時刻」（ミリ秒） */
  function getMinBookingTimestamp(): number {
    const hours = Math.max(0, Number(minHours.value) || 0)
    return Date.now() + hours * 60 * 60 * 1000
  }

  return { minHours, fetch, save, getMinBookingTimestamp }
}
