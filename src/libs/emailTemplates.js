// Minimal, client-safe transactional email (inline styles only).
export function codeEmail({ heading, intro, code, minutes }) {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#faf9fe;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e1638">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:420px;background:#ffffff;border:1px solid #e8e3f5;border-radius:16px;padding:32px">
      <tr><td style="font-size:15px;font-weight:600;color:#5a38c8;padding-bottom:20px">EchoMemories</td></tr>
      <tr><td style="font-size:20px;font-weight:600;padding-bottom:8px">${heading}</td></tr>
      <tr><td style="font-size:15px;line-height:1.5;color:#5a5278;padding-bottom:24px">${intro}</td></tr>
      <tr><td align="center" style="padding:16px;background:#f4f1fc;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:8px;color:#1e1638">${code}</td></tr>
      <tr><td style="font-size:13px;line-height:1.5;color:#736b90;padding-top:20px">This code expires in ${minutes} minutes. If you didn&rsquo;t request it, you can safely ignore this email.</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}
