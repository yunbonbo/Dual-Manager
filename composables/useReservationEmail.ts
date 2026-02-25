import emailjs from "@emailjs/browser"

/** メールアドレスを検証・トリミング（EmailJS "recipients address is corrupted" 対策） */
function sanitizeEmail(email: string | undefined | null): string {
  let s = String(email ?? "").trim()
  s = s.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "") // BOM等を除去
  if (!s || !s.includes("@") || s.length < 5) return ""
  return s
}

export type ReservationEmailParams = {
  customerName: string
  customerEmail: string
  shopName: string
  menuName: string
  datetime: string
  duration: number
  price: number
  cancelUrl?: string
  cancelDeadlineText?: string
  status?: "pending" | "confirmed" | "cancelled"
}

export function useReservationEmail() {
  const config = useRuntimeConfig()
  const serviceId = config.public?.emailjsServiceId || ""
  const templateCustomer = config.public?.emailjsTemplateIdCustomer || ""
  const templateAdmin = config.public?.emailjsTemplateIdAdmin || ""
  const publicKey = config.public?.emailjsPublicKey || ""
  const adminEmail = config.public?.adminEmail || ""
  const emailEnabled = config.public?.emailEnabled === true

  const isConfigured = !!(
    emailEnabled ||
    (serviceId && templateCustomer && publicKey)
  )

  if (import.meta.dev && !isConfigured) {
    console.log("[Dual-Manager] EmailJS 未設定:", {
      hasServiceId: !!serviceId,
      hasTemplateCustomer: !!templateCustomer,
      hasPublicKey: !!publicKey
    })
  }

  async function sendCustomerEmail(
    params: ReservationEmailParams,
    templateId = templateCustomer
  ): Promise<boolean> {
    if (!isConfigured || !templateId) {
      if (import.meta.dev) {
        console.log("[Dual-Manager] EmailJS 未設定のため顧客メールをスキップ")
      }
      return false
    }
    const toEmail = sanitizeEmail(params.customerEmail)
    if (!toEmail) {
      if (import.meta.dev) {
        console.warn("[Dual-Manager] 顧客メールアドレスが無効なため送信をスキップ")
      }
      return false
    }
    try {
      const templateParams = {
        to_email: toEmail,
        customer_name: String(params.customerName ?? "").trim() || "お客様",
        shop_name: String(params.shopName ?? "").trim() || "-",
        menu_name: String(params.menuName ?? "").trim() || "-",
        datetime: String(params.datetime ?? "").trim() || "-",
        duration: String(params.duration ?? 0),
        price: String(params.price ?? 0),
        cancel_url: String(params.cancelUrl ?? "").trim(),
        cancel_deadline_text:
          String(params.cancelDeadlineText ?? "").trim() ||
          "前日18時までキャンセル可能です",
        status: params.status || "pending"
      }
      const res = await emailjs.send(serviceId, templateId, templateParams, publicKey)
      if (import.meta.dev) {
        console.log("[Dual-Manager] 顧客メール送信成功:", res.status)
      }
      return true
    } catch (e) {
      console.error("[Dual-Manager] EmailJS 顧客送信エラー:", e)
      return false
    }
  }

  async function sendAdminEmail(params: ReservationEmailParams): Promise<boolean> {
    if (!isConfigured || !templateAdmin) {
      if (import.meta.dev) {
        console.log("[Dual-Manager] EmailJS 未設定のため管理者メールをスキップ")
      }
      return false
    }
    const toEmail = sanitizeEmail(adminEmail)
    if (!toEmail) {
      if (import.meta.dev) {
        console.warn("[Dual-Manager] 管理者メールアドレスが無効なため送信をスキップ")
      }
      return false
    }
    try {
      const templateParams = {
        to_email: toEmail,
        customer_name: String(params.customerName ?? "").trim() || "お客様",
        customer_email: sanitizeEmail(params.customerEmail) || "-",
        shop_name: String(params.shopName ?? "").trim() || "-",
        menu_name: String(params.menuName ?? "").trim() || "-",
        datetime: String(params.datetime ?? "").trim() || "-",
        duration: String(params.duration ?? 0),
        price: String(params.price ?? 0)
      }
      const res = await emailjs.send(serviceId, templateAdmin, templateParams, publicKey)
      if (import.meta.dev) {
        console.log("[Dual-Manager] 管理者メール送信成功:", res.status)
      }
      return true
    } catch (e) {
      console.error("[Dual-Manager] EmailJS 管理者送信エラー:", e)
      return false
    }
  }

  /** クライアント（ブラウザ）優先で送信。サーバーは「Allow API」不要で届きやすい */
  async function sendReservationEmailsViaServer(
    params: ReservationEmailParams
  ): Promise<boolean> {
    if (!isConfigured) return false
    // 1. まずブラウザから送信（EmailJS の制限が少ない）
    if (serviceId && templateCustomer && publicKey) {
      const [custOk, adminOk] = await Promise.all([
        sendCustomerEmail(params),
        templateAdmin ? sendAdminEmail(params) : Promise.resolve(true)
      ])
      if (custOk) {
        if (import.meta.dev) console.log("[Dual-Manager] クライアント送信成功")
        return true
      }
    }
    // 2. 失敗時はサーバーAPIを試行
    try {
      await $fetch("/api/email/send-reservation", {
        method: "POST",
        body: params
      })
      if (import.meta.dev) console.log("[Dual-Manager] サーバー送信成功")
      return true
    } catch (e) {
      if (import.meta.dev) console.warn("[Dual-Manager] サーバー送信失敗:", e)
      return false
    }
  }

  return {
    isConfigured,
    sendCustomerEmail,
    sendAdminEmail,
    sendReservationEmailsViaServer
  }
}
