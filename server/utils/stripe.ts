import Stripe from "stripe"

export function getStripe(): Stripe | null {
  const config = useRuntimeConfig()
  const secret = config.stripeSecretKey as string | undefined
  if (!secret) return null
  return new Stripe(secret, { typescript: true })
}
