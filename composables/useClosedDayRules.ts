/**
 * 定休日ルールの管理（weekday: 0=日 1=月 ... 6=土、week_of_month: null=毎週 1〜4=第N週）
 */
export type ClosedDayRule = {
  id: string
  weekday: number
  week_of_month: number | null
}

export function useClosedDayRules() {
  const { supabase } = useSupabase()
  const rules = ref<ClosedDayRule[]>([])

  async function fetch() {
    if (!supabase) return
    const { data } = await supabase
      .from("closed_day_rules")
      .select("id, weekday, week_of_month")
      .order("weekday")
      .order("week_of_month", { nullsFirst: false })
    rules.value = (data ?? []) as ClosedDayRule[]
  }

  async function add(weekday: number, weekOfMonth: number | null) {
    if (!supabase) return
    const { data } = await supabase
      .from("closed_day_rules")
      .insert({ weekday, week_of_month: weekOfMonth })
      .select("id, weekday, week_of_month")
      .single()
    if (data) rules.value = [...rules.value, data as ClosedDayRule]
  }

  async function remove(id: string) {
    if (!supabase) return
    await supabase.from("closed_day_rules").delete().eq("id", id)
    rules.value = rules.value.filter((r) => r.id !== id)
  }

  /** 指定日が定休日ルールに該当するか */
  function matchesRule(date: Date): boolean {
    const dayOfWeek = date.getDay()
    const dayOfMonth = date.getDate()
    const weekOfMonth = Math.ceil(dayOfMonth / 7)

    for (const rule of rules.value) {
      if (rule.weekday !== dayOfWeek) continue
      if (rule.week_of_month === null) return true
      if (rule.week_of_month === weekOfMonth) return true
    }
    return false
  }

  const weekdayLabels: Record<number, string> = {
    0: "日曜",
    1: "月曜",
    2: "火曜",
    3: "水曜",
    4: "木曜",
    5: "金曜",
    6: "土曜"
  }

  const weekLabels: Record<number, string> = {
    1: "第1週",
    2: "第2週",
    3: "第3週",
    4: "第4週"
  }

  function ruleLabel(rule: ClosedDayRule): string {
    if (rule.week_of_month === null) {
      return `${weekdayLabels[rule.weekday] ?? ""}（毎週）`
    }
    return `${weekdayLabels[rule.weekday] ?? ""}（${weekLabels[rule.week_of_month] ?? ""}）`
  }

  return {
    rules,
    fetch,
    add,
    remove,
    matchesRule,
    weekdayLabels,
    weekLabels,
    ruleLabel
  }
}
