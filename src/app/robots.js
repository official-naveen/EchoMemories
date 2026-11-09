const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/home", "/notifications", "/login", "/signup", "/forgot-password"] }],
    host: SITE_URL,
  }
}
