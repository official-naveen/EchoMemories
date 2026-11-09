import Image from "next/image"

// Situational illustrations of the brand ghost (files in /public/brand/mascot).
export const MASCOTS = ["empty-posts", "empty-notifications", "no-results", "error", "thinking", "achievement"]

export default function Mascot({ name, size = 140, float = true }) {
  return (
    <Image
      src={`/brand/mascot/${name}.png`}
      alt=""
      width={size}
      height={size}
      unoptimized
      aria-hidden="true"
      className={`ghost${float ? " float" : ""}`}
    />
  )
}
