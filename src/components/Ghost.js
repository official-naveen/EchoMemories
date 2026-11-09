import Image from "next/image"

// The brand character. Three pre-sized files keep it sharp without the
// image optimiser (so no extra server dependency).
function sourceFor(size) {
  if (size <= 48) return "/brand/ghost-96.png"
  if (size <= 128) return "/brand/ghost-256.png"
  return "/brand/ghost-512.png"
}

export default function Ghost({ size = 64, float = false, priority = false, className = "" }) {
  return (
    <Image
      src={sourceFor(size)}
      alt=""
      width={size}
      height={size}
      priority={priority}
      unoptimized
      aria-hidden="true"
      className={`ghost${float ? " float" : ""} ${className}`.trim()}
    />
  )
}
