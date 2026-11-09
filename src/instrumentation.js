// Runs once when the production server starts. Fails fast on a misconfigured
// deployment instead of failing later, request by request.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return

  const placeholder = (v) => !v || v === "change-me" || v === "change-me-too"
  const missing = ["DATABASE_URL", "JWT_SECRET"].filter((k) => placeholder(process.env[k]))
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}. See .env.example.`)
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.")
  }
  if (placeholder(process.env.CRON_SECRET)) {
    console.warn("[config] CRON_SECRET is not set: the daily pulse/streak jobs will be rejected.")
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[config] EMAIL_USER / EMAIL_PASS are not set: signup and password reset emails cannot be sent.")
  }
}
