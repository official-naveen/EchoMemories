export function extractMentions(text = "") {
  const found = new Set()
  const re = /(?:^|[^a-z0-9_])@([a-z][a-z0-9_]{2,19})/gi
  let m
  while ((m = re.exec(text))) found.add(m[1].toLowerCase())
  return [...found].slice(0, 10)
}
