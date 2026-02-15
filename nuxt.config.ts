// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    public: {
      stripeEnabled: process.env.NUXT_PUBLIC_STRIPE_ENABLED === "true",
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      /** EmailJS: https://www.emailjs.com/ */
      emailjsServiceId: process.env.NUXT_PUBLIC_EMAILJS_SERVICE_ID || "",
      emailjsTemplateIdCustomer: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER || "",
      emailjsTemplateIdAdmin: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN || "",
      emailjsPublicKey: process.env.NUXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
      adminEmail: process.env.NUXT_PUBLIC_ADMIN_EMAIL || ""
    }
  }
})
