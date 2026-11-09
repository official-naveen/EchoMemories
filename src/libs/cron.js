import { safeEqual } from "@/libs/otp"

// Protects maintenance endpoints. Call them with
//   Authorization: Bearer <CRON_SECRET>   (or header x-cron-secret)
export function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret === "change-me-too") {
    return process.env.NODE_ENV !== "production"
  }
  const bearer = req.headers.get("authorization") || ""
  const header = req.headers.get("x-cron-secret") || ""
  return safeEqual(bearer, `Bearer ${secret}`) || safeEqual(header, secret)
}
