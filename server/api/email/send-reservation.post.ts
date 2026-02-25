/**
 * 予約完了メールをサーバーから送信（顧客・管理者双方）
 * 既存サービス優先: EmailJS > Gmail SMTP > Resend
 * 失敗時は次の方式を試す（新規登録不要）
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

function buildCustomerEmailHtml(params: ReservationEmailBody): string {
  const name = String(params.customerName ?? "").trim() || "お客様"
  const shop = String(params.shopName ?? "").trim() || "-"
  const menu = String(params.menuName ?? "").trim() || "-"
  const dt = String(params.datetime ?? "").trim() || "-"
  const dur = String(params.duration ?? 0)
  const price = String(params.price ?? 0)
  const cancelUrl = String(params.cancelUrl ?? "").trim()
  const deadline =
    String(params.cancelDeadlineText ?? "").trim() || "前日18時までキャンセル可能です"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>${escapeHtml(name)} 様</p>
  <p>予約のご確認です。</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">店舗</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(shop)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">メニュー</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(menu)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">日時</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(dt)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">所要時間</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${dur}分</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">料金</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${price}円</td></tr>
  </table>
  <p>${escapeHtml(deadline)}</p>
  ${cancelUrl ? `<p>キャンセルは<a href="${escapeHtml(cancelUrl)}">こちらのリンク</a>から可能です。</p>` : ""}
  <p>よろしくお願いいたします。</p>
</body>
</html>
`.trim()
}

function buildAdminEmailHtml(params: ReservationEmailBody): string {
  const name = String(params.customerName ?? "").trim() || "-"
  const email = sanitizeEmail(params.customerEmail) || "-"
  const shop = String(params.shopName ?? "").trim() || "-"
  const menu = String(params.menuName ?? "").trim() || "-"
  const dt = String(params.datetime ?? "").trim() || "-"
  const dur = String(params.duration ?? 0)
  const price = String(params.price ?? 0)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>新規予約の通知です。</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">お名前</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">メール</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(email)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">店舗</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(shop)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">メニュー</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(menu)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">日時</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(dt)}</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">所要時間</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${dur}分</td></tr>
    <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">料金</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${price}円</td></tr>
  </table>
</body>
</html>
`.trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
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

  const adminEmail = sanitizeEmail(config.public.adminEmail as string)
  const smtpUser = config.smtpUser as string
  const smtpPass = config.smtpPass as string
  const smtpHost = config.smtpHost as string
  const smtpPort = config.smtpPort as number
  const smtpFrom = (config.smtpFrom as string) || smtpUser
  const resendApiKey = config.resendApiKey as string
  const resendFrom = config.resendFromEmail as string
  const brevoApiKey = config.brevoApiKey as string
  const brevoSenderEmail = config.brevoSenderEmail as string
  const brevoSenderName = (config.brevoSenderName as string) || "予約システム"
  const serviceId = config.public.emailjsServiceId as string
  const templateCustomer = config.public.emailjsTemplateIdCustomer as string
  const templateAdmin = config.public.emailjsTemplateIdAdmin as string
  const publicKey = config.public.emailjsPublicKey as string
  const privateKey = config.emailjsPrivateKey as string

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
      String(body.cancelDeadlineText ?? "").trim() ||
      "前日18時までキャンセル可能です",
    status: body.status || "pending"
  }

  const providers: Array<{ name: string; try: () => Promise<boolean> }> = []

  // 1. EmailJS（既存アカウント・新規登録不要）
  if (serviceId && templateCustomer && publicKey) {
    providers.push({
      name: "emailjs",
      try: async () => {
        const { default: emailjs } = await import("@emailjs/nodejs")
        const opts = { publicKey, ...(privateKey && { privateKey }) }
        await emailjs.send(serviceId, templateCustomer, customerParams, opts)
        if (templateAdmin && adminEmail) {
          const adminParams = {
            to_email: adminEmail,
            customer_name: customerParams.customer_name,
            customer_email: customerEmail || "-",
            shop_name: customerParams.shop_name,
            menu_name: customerParams.menu_name,
            datetime: customerParams.datetime,
            duration: customerParams.duration,
            price: customerParams.price
          }
          await emailjs.send(serviceId, templateAdmin, adminParams, opts)
        }
        return true
      }
    })
  }

  // 2. Gmail SMTP（既存 Gmail・新規登録不要）
  if (smtpUser && smtpPass) {
    providers.push({
      name: "smtp",
      try: async () => {
        const nodemailer = await import("nodemailer")
        const transporter = nodemailer.default.createTransport({
          host: smtpHost || "smtp.gmail.com",
          port: smtpPort || 587,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass }
        })
        const fromAddr = smtpFrom.includes("<") ? smtpFrom : `予約システム <${smtpUser}>`
        const customerHtml = buildCustomerEmailHtml(body)
        await transporter.sendMail({
          from: fromAddr,
          to: customerEmail,
          subject: "【予約確認】ご予約のご案内",
          html: customerHtml
        })
        if (adminEmail) {
          await transporter.sendMail({
            from: fromAddr,
            to: adminEmail,
            subject: "【新規予約】予約がありました",
            html: buildAdminEmailHtml(body)
          })
        }
        return true
      }
    })
  }

  // 3. Resend（既存アカウント・ドメイン認証済みなら届く）
  if (resendApiKey) {
    providers.push({
      name: "resend",
      try: async () => {
        const { Resend } = await import("resend")
        const resend = new Resend(resendApiKey)
        const customerHtml = buildCustomerEmailHtml(body)
        const { error: custErr } = await resend.emails.send({
          from: resendFrom,
          to: customerEmail,
          subject: "【予約確認】ご予約のご案内",
          html: customerHtml
        })
        if (custErr) throw custErr
        if (adminEmail) {
          await resend.emails.send({
            from: resendFrom,
            to: adminEmail,
            subject: "【新規予約】予約がありました",
            html: buildAdminEmailHtml(body)
          })
        }
        return true
      }
    })
  }

  // 4. Brevo（新規登録が必要）
  if (brevoApiKey && brevoSenderEmail) {
    providers.push({
      name: "brevo",
      try: async () => {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": brevoApiKey, "content-type": "application/json" },
          body: JSON.stringify({
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email: customerEmail }],
            subject: "【予約確認】ご予約のご案内",
            htmlContent: buildCustomerEmailHtml(body)
          })
        })
        if (!res.ok) throw new Error(await res.text())
        if (adminEmail) {
          await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoApiKey, "content-type": "application/json" },
            body: JSON.stringify({
              sender: { name: brevoSenderName, email: brevoSenderEmail },
              to: [{ email: adminEmail }],
              subject: "【新規予約】予約がありました",
              htmlContent: buildAdminEmailHtml(body)
            })
          })
        }
        return true
      }
    })
  }

  if (providers.length === 0) {
    throw createError({
      statusCode: 503,
      statusMessage: "メール送信の設定がありません。EmailJS、SMTP、Resend のいずれかを設定してください。"
    })
  }

  // 順に試して、成功したら即返す
  for (const p of providers) {
    try {
      await p.try()
      return { ok: true, provider: p.name }
    } catch (e) {
      console.warn(`[Dual-Manager] ${p.name} 送信失敗、次を試行:`, e)
    }
  }

  throw createError({
    statusCode: 502,
    statusMessage:
      "すべてのメール送信方式が失敗しました。EmailJS の「Account > Security」で「Allow API requests」を ON にしてください。"
  })
})
