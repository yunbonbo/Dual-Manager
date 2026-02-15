export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = (await import("../../utils/stripe")).getStripe()
  if (!stripe) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe が設定されていません"
    })
  }

  const sessionId = getRouterParam(event, "id") || getQuery(event).session_id
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "session_id が必要です"
    })
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: []
  })

  const reservationId = session.metadata?.reservation_id
  if (!reservationId) {
    return { paid: session.payment_status === "paid", reservation: null }
  }

  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseAnonKey = config.public.supabaseAnonKey as string
  if (!supabaseUrl || !supabaseAnonKey) {
    return { paid: session.payment_status === "paid", reservationId }
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: res } = await supabase
    .from("reservations")
    .select("id, start_at, end_at, name, email, shop_id, menu_id, cancel_token")
    .eq("id", reservationId)
    .single()

  if (!res) {
    return { paid: session.payment_status === "paid", reservation: null }
  }

  let shopName = "-"
  let menuName = "-"
  let duration = 0
  let price = 0
  if (res.shop_id) {
    const { data: shop } = await supabase
      .from("shops")
      .select("name")
      .eq("id", res.shop_id)
      .single()
    shopName = shop?.name ?? "-"
  }
  if (res.menu_id) {
    const { data: menu } = await supabase
      .from("menus")
      .select("name, duration, price")
      .eq("id", res.menu_id)
      .single()
    menuName = menu?.name ?? "-"
    duration = menu?.duration ?? 0
    price = menu?.price ?? 0
  }

  const startAt = new Date(res.start_at)
  const formatDt = `${startAt.getMonth() + 1}/${startAt.getDate()} (${["日","月","火","水","木","金","土"][startAt.getDay()]}) ${startAt.getHours().toString().padStart(2, "0")}:${startAt.getMinutes().toString().padStart(2, "0")}`

  return {
    paid: session.payment_status === "paid",
    reservation: {
      id: res.id,
      start_at: res.start_at,
      end_at: res.end_at,
      name: res.name,
      email: res.email,
      shop_name: shopName,
      menu_name: menuName,
      duration,
      price,
      datetime: formatDt,
      cancel_token: res.cancel_token
    }
  }
})
