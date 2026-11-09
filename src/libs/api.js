// Tiny fetch wrapper for client components. Throws ApiError with a readable
// message so every screen can show errors the same way.
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(url, { method = "GET", body, signal } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) throw new ApiError(data?.error || "Something went wrong. Please try again.", res.status)
  return data
}
