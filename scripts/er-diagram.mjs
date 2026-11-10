// Prints a Mermaid ER diagram of every table and column, read straight from
// prisma/schema.prisma so it can't drift from the real database.
//   node scripts/er-diagram.mjs > docs/er-diagram.mmd
import fs from "node:fs"

const src = fs.readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8")
const enums = new Set([...src.matchAll(/^enum (\w+)/gm)].map((m) => m[1]))
const models = [...src.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map((m) => ({ name: m[1], body: m[2] }))
const names = new Set(models.map((m) => m.name))

const tables = []
const links = []
for (const { name, body } of models) {
  const cols = []
  const fks = new Set()
  const lines = body.split("\n").map((l) => l.replace(/\/\/.*$/, "").trim()).filter(Boolean)
  for (const l of lines) {
    const rel = l.match(/@relation\((?:"[^"]*",\s*)?fields:\s*\[(\w+)\]/)
    if (rel) fks.add(rel[1])
  }
  for (const l of lines) {
    if (l.startsWith("@@")) continue
    const m = l.match(/^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/)
    if (!m) continue
    const [, field, type, list, optional, rest] = m
    if (names.has(type)) {
      // Relation field: draw the link once, from the side that holds the foreign key.
      const rel = rest.match(/@relation\((?:"([^"]*)",\s*)?fields:\s*\[(\w+)\]/)
      if (rel) links.push({ from: type, to: name, label: field, optional: !!optional, self: type === name })
      continue
    }
    const keys = []
    if (/@id\b/.test(rest)) keys.push("PK")
    if (fks.has(field)) keys.push("FK")
    if (/@unique\b/.test(rest)) keys.push("UK")
    const t = enums.has(type) ? type : type.toLowerCase()
    cols.push(`    ${t} ${field}${keys.length ? " " + keys.join(",") : ""}${optional ? ' "nullable"' : ""}`)
  }
  tables.push(`  ${name} {\n${cols.join("\n")}\n  }`)
}

const out = ["erDiagram"]
for (const l of links) {
  // "one parent, many children"; the child's foreign key may be optional.
  out.push(`  ${l.from} ${l.optional ? "|o" : "||"}--o{ ${l.to} : "${l.label}"`)
}
out.push("", ...tables)
console.log(out.join("\n"))
