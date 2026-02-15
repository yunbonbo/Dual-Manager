import { createClient } from "@supabase/supabase-js"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = (await import("../../utils/stripe")).getStripe()
  if (!stripe) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe が設定されていません"
    })
  }

  const body = await readBody<{
    shop_id: string
    menu_id: string
    start_at: string
    end_at: string
    name: string
    name_kana: string
    tel: string
    email: string
    gender?: string
    birthday?: string
    shop_name: string
    menu_name: string
    price: number
  }>(event)

  const required = ["shop_id", "menu_id", "start_at", "end_at", "name", "name_kana", "tel", "email", "price"]
  for (const key of required) {
    if (!(key in body) || (body as Record<string, unknown>)[key] === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: `必須項目が不足しています: ${key}`
      })
    }
  }

  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseAnonKey = config.public.supabaseAnonKey as string
  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Supabase が設定されていません"
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // cancel_token を生成
  const cancelToken = crypto.randomUUID()

  // 1. 予約を Supabase に作成（status: pending）
  const { data: reservation, error: insertError } = await supabase
    .from("reservations")
    .insert({
      shop_id: body.shop_id,
      menu_id: body.menu_id,
      start_at: body.start_at,
      end_at: body.end_at,
      name: body.name.trim(),
      name_kana: body.name_kana.trim(),
      tel: body.tel.trim(),
      email: body.email.trim(),
      gender: body.gender || null,
      birthday: body.birthday || null,
      admin_memo: "",
      status: "pending",
      cancel_token: cancelToken
    })
    .select("id")
    .single()

  if (insertError || !reservation) {
    console.error("[Dual-Manager] Stripe: 予約作成失敗:", insertError)
    throw createError({
      statusCode: 500,
      statusMessage: "予約の保存に失敗しました"
    })
  }

  // 2. Stripe Checkout Session を作成
  // 金額は円（JPY）で、Stripe は最小単位が円のため amount はそのまま
  const origin = getRequestURL(event).origin
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: `${body.shop_name} - ${body.menu_name}`,
            description: `${body.start_at} の予約`
          },
          unit_amount: body.price
        },
        quantity: 1
      }
    ],
    metadata: {
      reservation_id: reservation.id
    },
    success_url: `${origin}/reservation-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?cancel=1`
  })

  return { url: session.url, reservationId: reservation.id }
})
