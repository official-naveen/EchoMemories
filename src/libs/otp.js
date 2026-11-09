import crypto from "node:crypto"
import { getSecret } from "@/libs/auth"

export function generateOTP() {
  return String(crypto.randomInt(100000, 1000000))
}

// Keyed hash (HMAC) so a stolen cookie can't be brute-forced offline.
export function hashOTP(otp, email = "") {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${email}:${String(otp).trim()}`)
    .digest("hex")
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}
