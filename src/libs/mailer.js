import nodemailer from "nodemailer"

const hasCreds = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)

const transport = hasCreds
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null

// In development without SMTP credentials the mail is printed to the console
// so signup and password reset can still be tested end-to-end.
export async function sendMail({ to, subject, html }) {
  if (transport) {
    return transport.sendMail({ from: `"EchoMemories" <${process.env.EMAIL_USER}>`, to, subject, html })
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_USER / EMAIL_PASS are not configured")
  }
  console.log("\n[DEV MAIL] to:", to, "| subject:", subject)
  console.log(html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), "\n")
  return { dev: true }
}
