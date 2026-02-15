/**
 * 臨時休業日の管理（ダッシュボードでクリックして追加・解除）
 */
export function useClosedDates() {
  const { supabase } = useSupabase()
  const closedDates = ref<Set<string>>(new Set()) // "YYYY-MM-DD" 形式

  async function fetchForMonth(year: number, month: number) {
    if (!supabase) return
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)

    const { data } = await supabase
      .from("closed_dates")
      .select("date")
      .gte("date", startStr)
      .lte("date", endStr)

    const set = new Set<string>()
    for (const row of data ?? []) {
      set.add(String(row.date).slice(0, 10))
    }
    closedDates.value = set
  }

  /** カレンダー表示用：前月・当月・翌月の3か月分を取得（month は 1〜12） */
  async function fetchForCalendarView(year: number, month: number) {
    if (!supabase) return
    const start = new Date(year, month - 2, 1)
    const end = new Date(year, month + 1, 0)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)

    const { data } = await supabase
      .from("closed_dates")
      .select("date")
      .gte("date", startStr)
      .lte("date", endStr)

    const set = new Set<string>()
    for (const row of data ?? []) {
      set.add(String(row.date).slice(0, 10))
    }
    closedDates.value = set
  }

  async function toggle(dateStr: string) {
    if (!supabase) return
    const has = closedDates.value.has(dateStr)
    if (has) {
      await supabase.from("closed_dates").delete().eq("date", dateStr)
      closedDates.value = new Set([...closedDates.value].filter((d) => d !== dateStr))
    } else {
      await supabase.from("closed_dates").insert({ date: dateStr })
      closedDates.value = new Set([...closedDates.value, dateStr])
    }
  }

  function isClosed(dateStr: string): boolean {
    return closedDates.value.has(dateStr)
  }

  return {
    closedDates,
    fetchForMonth,
    fetchForCalendarView,
    toggle,
    isClosed
  }
}
