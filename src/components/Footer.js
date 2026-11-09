"use client"

import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"

export default function Footer() {
  const { me } = useAuth()
  return (
    <footer className={`site-footer${me ? " with-bottom-nav" : ""}`}>
      <Link href="/about">About</Link> · © {new Date().getFullYear()} EchoMemories · Built by{" "}
      <a href="https://github.com/official-naveen" target="_blank" rel="noopener noreferrer">Naveen Kumar</a>
    </footer>
  )
}
