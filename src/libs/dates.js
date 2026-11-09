const DAY = 24 * 60 * 60 * 1000

function offsetMs() {
  const m = parseInt(process.env.APP_TZ_OFFSET_MINUTES || "0", 10)
  return (Number.isFinite(m) ? m : 0) * 60 * 1000
}

// Integer "calendar day number" in the app's timezone.
export function dayKey(date = new Date()) {
  return Math.floor((new Date(date).getTime() + offsetMs()) / DAY)
}

export function dayDiff(later, earlier) {
  return dayKey(later) - dayKey(earlier)
}

// The instant at which the given day number starts.
export function dayStart(key) {
  return new Date(key * DAY - offsetMs())
}
