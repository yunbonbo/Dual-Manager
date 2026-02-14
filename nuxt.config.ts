// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      /**
       * Supabase の URL と anon key は .env から読み込みます。
       * 例:
       * NUXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
       * NUXT_PUBLIC_SUPABASE_ANON_KEY="xxxxx"
       */
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }
})
