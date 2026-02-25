// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    /** EmailJS Private Key（サーバー送信用・Account > Security で取得） */
    emailjsPrivateKey: process.env.EMAILJS_PRIVATE_KEY || "",
    /** Resend: 届きやすいメール送信 https://resend.com（ドメイン認証必須） */
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendFromEmail:
      process.env.RESEND_FROM_EMAIL || "予約システム <onboarding@resend.dev>",
    /** Gmail SMTP: ドメイン不要で即使える。2段階認証+アプリパスワード必要 */
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    smtpFrom: process.env.SMTP_FROM || "",
    /** Brevo: サーバーレス向け・送信元メール要認証 https://brevo.com */
    brevoApiKey: process.env.BREVO_API_KEY || "",
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "",
    brevoSenderName: process.env.BREVO_SENDER_NAME || "予約システム",
    public: {
      stripeEnabled: process.env.NUXT_PUBLIC_STRIPE_ENABLED === "true",
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      /** EmailJS: https://www.emailjs.com/ */
      emailjsServiceId: process.env.NUXT_PUBLIC_EMAILJS_SERVICE_ID || "",
      emailjsTemplateIdCustomer: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER || "",
      emailjsTemplateIdAdmin: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN || "",
      emailjsPublicKey: process.env.NUXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
      adminEmail: process.env.NUXT_PUBLIC_ADMIN_EMAIL || "",
      /** Resend 使用時は true に（RESEND_API_KEY とセット） */
      emailEnabled: process.env.NUXT_PUBLIC_EMAIL_ENABLED === "true"
    }
  }
})
