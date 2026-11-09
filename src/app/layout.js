import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ToastProvider } from "@/components/Toast"
import SiteHeader from "@/components/SiteHeader"
import Footer from "@/components/Footer"
import { themeInitScript } from "@/components/ThemeToggle"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const DESCRIPTION = "Anonymous echoes, quiet rooms and real presence. Say it once. Let it echo."

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
}

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "EchoMemories", template: "%s · EchoMemories" },
  description: DESCRIPTION,
  openGraph: { title: "EchoMemories", description: DESCRIPTION, siteName: "EchoMemories", type: "website" },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <AuthProvider>
          <ToastProvider>
            <SiteHeader />
            {children}
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
