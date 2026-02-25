/**
 * 予約完了メールをサーバーから送信（顧客・管理者双方）
 * クライアント送信より確実に届く
 */

interface ReservationEmailBody {
  customerName: string
  customerEmail: string
  shopName: string
  menuName: string
  datetime: string
  duration: number
  price: number
  cancelUrl?: string
  cancelDeadlineText?: string
  status?: string
}

function sanitizeEmail(email: string | undefined | null): string {
  let s = String(email ?? "").trim()
  s = s.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "")
  if (!s || !s.includes("@") || s.length < 5) return ""
  return s
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const serviceId = config.public.emailjsServiceId as string
  const templateCustomer = config.public.emailjsTemplateIdCustomer as string
  const templateAdmin = config.public.emailjsTemplateIdAdmin as string
  const publicKey = config.public.emailjsPublicKey as string
  const privateKey = config.emailjsPrivateKey as string
  const adminEmail = config.public.adminEmail as string

  if (!serviceId || !templateCustomer || !publicKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "メール送信の設定が完了していません（EmailJS）"
    })
  }

  const body = await readBody<ReservationEmailBody>(event)
  if (!body?.customerEmail || !body?.customerName) {
    throw createError({
      statusCode: 400,
      statusMessage: "customerEmail, customerName は必須です"
    })
  }

  const customerEmail = sanitizeEmail(body.customerEmail)
  if (!customerEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "有効なメールアドレスを指定してください"
    })
  }

  const { default: emailjs } = await import("@emailjs/nodejs")

  const opts = {
    publicKey,
    ...(privateKey && { privateKey })
  }

  const customerParams = {
    to_email: customerEmail,
    customer_name: String(body.customerName ?? "").trim() || "お客様",
    shop_name: String(body.shopName ?? "").trim() || "-",
    menu_name: String(body.menuName ?? "").trim() || "-",
    datetime: String(body.datetime ?? "").trim() || "-",
    duration: String(body.duration ?? 0),
    price: String(body.price ?? 0),
    cancel_url: String(body.cancelUrl ?? "").trim(),
    cancel_deadline_text:
      String(body.cancelDeadlineText ?? "").trim() || "前日18時までキャンセル可能です",
    status: body.status || "pending"
  }

  const adminParams = {
    to_email: sanitizeEmail(adminEmail) || customerEmail,
    customer_name: String(body.customerName ?? "").trim() || "お客様",
    customer_email: customerEmail || "-",
    shop_name: String(body.shopName ?? "").trim() || "-",
    menu_name: String(body.menuName ?? "").trim() || "-",
    datetime: String(body.datetime ?? "").trim() || "-",
    duration: String(body.duration ?? 0),
    price: String(body.price ?? 0)
  }

  try {
    await emailjs.send(serviceId, templateCustomer, customerParams, opts)
  } catch (e) {
    console.error("[Dual-Manager] 顧客メール送信エラー:", e)
    throw createError({
      statusCode: 502,
      statusMessage: "顧客へのメール送信に失敗しました"
    })
  }

  if (templateAdmin && adminEmail) {
    try {
      await emailjs.send(serviceId, templateAdmin, adminParams, opts)
    } catch (e) {
      console.error("[Dual-Manager] 管理者メール送信エラー:", e)
    }
  }

  return { ok: true }
})
