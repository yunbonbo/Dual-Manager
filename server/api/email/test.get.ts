/**
 * メール送信の診断用（設定確認・テスト送信）
 * ブラウザで /api/email/test を開くと状態を確認できる
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const testTo = query.to as string | undefined

  const status = {
    emailjs:
      !!(config.public.emailjsServiceId as string) &&
      !!(config.public.emailjsTemplateIdCustomer as string) &&
      !!(config.public.emailjsPublicKey as string),
    smtp: !!(config.smtpUser as string) && !!(config.smtpPass as string),
    resend: !!(config.resendApiKey as string),
    brevo: !!(config.brevoApiKey as string) && !!(config.brevoSenderEmail as string),
    adminEmail: !!(config.public.adminEmail as string),
    emailEnabled: config.public.emailEnabled === true
  }

  const activeProvider = status.brevo
    ? "brevo"
    : status.smtp
      ? "smtp"
      : status.resend
        ? "resend"
        : status.emailjs
          ? "emailjs"
          : "none"

  if (!testTo || !testTo.includes("@")) {
    return {
      message: "メール設定の状態です。?to=test@example.com でテスト送信できます。",
      activeProvider,
      status,
      hint:
        activeProvider === "none"
          ? "Brevo（課金不要・推奨）または Gmail SMTP を設定: docs/BREVO_SETUP.md"
          : undefined
    }
  }

  // テスト送信（優先順位: Brevo > SMTP > Resend > EmailJS）
  const customerHtml = `
<!DOCTYPE html>
<html><body><p>これはテストメールです。メール送信は正常に動作しています。</p></body></html>
`
  try {
    if (status.brevo) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": config.brevoApiKey as string,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: (config.brevoSenderName as string) || "予約システム",
            email: config.brevoSenderEmail as string
          },
          to: [{ email: testTo }],
          subject: "【テスト】メール送信確認",
          htmlContent: customerHtml
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { error: "Brevo 送信失敗", status: res.status, detail: err }
      }
      return { ok: true, provider: "brevo", message: `${testTo} にテストメールを送信しました。` }
    }

    if (status.smtp) {
      const nodemailer = await import("nodemailer")
      const transporter = nodemailer.default.createTransport({
        host: (config.smtpHost as string) || "smtp.gmail.com",
        port: (config.smtpPort as number) || 587,
        secure: (config.smtpPort as number) === 465,
        auth: {
          user: config.smtpUser as string,
          pass: config.smtpPass as string
        }
      })
      const from = (config.smtpFrom as string) || config.smtpUser
      await transporter.sendMail({
        from: from.includes("<") ? from : `予約システム <${config.smtpUser}>`,
        to: testTo,
        subject: "【テスト】メール送信確認",
        html: customerHtml
      })
      return { ok: true, provider: "smtp", message: `${testTo} にテストメールを送信しました。` }
    }

    if (status.resend) {
      const { Resend } = await import("resend")
      const resend = new Resend(config.resendApiKey as string)
      const { error } = await resend.emails.send({
        from: config.resendFromEmail as string,
        to: testTo,
        subject: "【テスト】メール送信確認",
        html: customerHtml
      })
      if (error) throw error
      return { ok: true, provider: "resend", message: `${testTo} にテストメールを送信しました。` }
    }

    if (status.emailjs) {
      const { default: emailjs } = await import("@emailjs/nodejs")
      const opts = {
        publicKey: config.public.emailjsPublicKey as string,
        ...((config.emailjsPrivateKey as string) && {
          privateKey: config.emailjsPrivateKey as string
        })
      }
      await emailjs.send(
        config.public.emailjsServiceId as string,
        config.public.emailjsTemplateIdCustomer as string,
        {
          to_email: testTo,
          customer_name: "テスト",
          shop_name: "-",
          menu_name: "-",
          datetime: "-",
          duration: "0",
          price: "0",
          cancel_url: "",
          cancel_deadline_text: "前日18時までキャンセル可能です",
          status: "pending"
        },
        opts
      )
      return { ok: true, provider: "emailjs", message: `${testTo} にテストメールを送信しました。迷惑メールも確認してください。` }
    }

    return { error: "メール送信の設定がありません。", status }
  } catch (e) {
    console.error("[Dual-Manager] テスト送信エラー:", e)
    return {
      error: "送信失敗",
      detail: String(e),
      activeProvider,
      status
    }
  }
})
