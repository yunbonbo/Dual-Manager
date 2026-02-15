/**
 * .ics ファイル生成・ダウンロード（カレンダー連携）
 * Google カレンダー、Outlook、Apple カレンダー等にインポート可能
 */

export type IcsEventParams = {
  title: string
  startAt: Date
  endAt: Date
  description?: string
  location?: string
}

/** Date を iCalendar 形式 (YYYYMMDDTHHMMSS) に変換 */
function toIcsDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** テキストを iCalendar 用にエスケープ（改行・カンマ・セミコロン） */
function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

export function useIcsDownload() {
  function generateIcsContent(params: IcsEventParams): string {
    const uid = `dual-manager-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const now = toIcsDate(new Date())
    const start = toIcsDate(params.startAt)
    const end = toIcsDate(params.endAt)
    const title = escapeIcsText(params.title)
    const desc = params.description ? escapeIcsText(params.description) : ""
    const loc = params.location ? escapeIcsText(params.location) : ""

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dual-Manager//予約管理//JA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      desc ? `DESCRIPTION:${desc}` : "",
      loc ? `LOCATION:${loc}` : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ]
      .filter(Boolean)
      .join("\r\n")
  }

  function downloadIcs(params: IcsEventParams, filename = "reservation.ics") {
    const content = generateIcsContent(params)
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { generateIcsContent, downloadIcs }
}
