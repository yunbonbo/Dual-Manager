import type Stripe from "stripe"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = (await import("../../utils/stripe")).getStripe()
  const webhookSecret = config.stripeWebhookSecret as string

  if (!stripe || !webhookSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe Webhook が設定されていません"
    })
  }

  const signature = getHeader(event, "stripe-signature")
  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing Stripe signature"
    })
  }

  const body = await readRawBody(event)
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing request body"
    })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[Dual-Manager] Stripe Webhook 署名検証失敗:", msg)
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Stripe webhook signature"
    })
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const reservationId = session.metadata?.reservation_id
    if (reservationId) {
      const supabaseUrl = config.public.supabaseUrl as string
      const supabaseAnonKey = config.public.supabaseAnonKey as string
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        await supabase
          .from("reservations")
          .update({
            admin_memo: (session.payment_status === "paid" ? "[決済完了] " : "") + (session.id ? `Stripe: ${session.id}` : "")
          })
          .eq("id", reservationId)
      }
    }
  }

  return { received: true }
})
