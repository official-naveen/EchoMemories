import crypto from "node:crypto"
import jwt from "jsonwebtoken"

export function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === "change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a long random value")
    }
    return "dev-only-insecure-secret"
  }
  return secret
}

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, getSecret(), { expiresIn })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch {
    return null
  }
}

// A short fingerprint of the current password hash. It is stored inside the
// session token, so changing the password instantly invalidates every older
// session (and single-use reset codes).
export function passwordVersion(passwordHash) {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16)
}

export function issueSession(user, remember = false) {
  const days = remember ? 30 : 7
  return {
    token: signToken({ userId: user.id, pv: passwordVersion(user.passwordHash) }, `${days}d`),
    maxAge: days * 24 * 60 * 60,
  }
}
