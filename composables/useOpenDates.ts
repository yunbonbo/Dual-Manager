/**
 * 臨時営業日の管理（通常は定休だが営業する日）
 */
export function useOpenDates() {
  const { supabase } = useSupabase()
  const openDates = ref<Set<string>>(new Set())

  async function fetchForMonth(year: number, month: number) {
    if (!supabase) return
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)

    const { data } = await supabase
      .from("open_dates")
      .select("date")
      .gte("date", startStr)
      .lte("date", endStr)

    const set = new Set<string>()
    for (const row of data ?? []) {
      set.add(String(row.date).slice(0, 10))
    }
    openDates.value = set
  }

  async function fetchForCalendarView(year: number, month: number) {
    if (!supabase) return
    const start = new Date(year, month - 2, 1)
    const end = new Date(year, month + 1, 0)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)

    const { data } = await supabase
      .from("open_dates")
      .select("date")
      .gte("date", startStr)
      .lte("date", endStr)

    const set = new Set<string>()
    for (const row of data ?? []) {
      set.add(String(row.date).slice(0, 10))
    }
    openDates.value = set
  }

  async function toggle(dateStr: string) {
    if (!supabase) return
    const has = openDates.value.has(dateStr)
    if (has) {
      await supabase.from("open_dates").delete().eq("date", dateStr)
      openDates.value = new Set([...openDates.value].filter((d) => d !== dateStr))
    } else {
      await supabase.from("open_dates").insert({ date: dateStr })
      openDates.value = new Set([...openDates.value, dateStr])
    }
  }

  function isOpen(dateStr: string): boolean {
    return openDates.value.has(dateStr)
  }

  return {
    openDates,
    fetchForMonth,
    fetchForCalendarView,
    toggle,
    isOpen
  }
}
