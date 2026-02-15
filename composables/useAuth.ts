import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const { supabase } = useSupabase()
  const user = ref<User | null>(null)
  const loading = ref(true)

  async function init() {
    if (!supabase) {
      loading.value = false
      return
    }
    const {
      data: { session }
    } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error("Supabase が初期化されていません")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
  }

  const isAuthenticated = computed(() => !!user.value)

  return { user, loading, isAuthenticated, init, signIn, signOut }
}
