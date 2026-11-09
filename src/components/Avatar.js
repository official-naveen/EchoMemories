import Ghost from "@/components/Ghost"

// Restrained palette taken from the ghost, so every avatar feels on-brand.
const PALETTE = [
  ["#7b52e2", "#a47cf4"],
  ["#5b6cf0", "#8f9cfa"],
  ["#9b5de5", "#c79bf2"],
  ["#6a4cc9", "#9c85ee"],
  ["#b05fd8", "#d7a0f0"],
  ["#4f5bd5", "#8b94f0"],
]

function pick(str = "") {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

const gradient = (key) => {
  const [a, b] = pick(key)
  return `linear-gradient(135deg, ${a}, ${b})`
}

export const roomColor = gradient

// Anonymous authors (Space) are represented by the ghost itself.
export default function Avatar({ name, anon = false, size = "", seed }) {
  if (anon || !name) {
    return (
      <div className={`avatar anon ${size}`.trim()} aria-hidden="true">
        <Ghost size={32} />
      </div>
    )
  }
  return (
    <div className={`avatar ${size}`.trim()} style={{ background: gradient(seed || name) }} aria-hidden="true">
      {name.trim()[0].toUpperCase()}
    </div>
  )
}
