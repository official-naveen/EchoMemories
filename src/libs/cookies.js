// One place that decides how every cookie is issued.
// SameSite=Lax (not Strict) so that following a link from an email or another
// site doesn't look like a logged-out visit. State-changing endpoints are all
// POST/PATCH/DELETE, which Lax never sends cross-site.
const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
}

export const setCookie = (name, value, maxAge) => ({ name, value, ...base, maxAge })
export const clearCookie = (name) => ({ name, value: "", ...base, maxAge: 0 })
