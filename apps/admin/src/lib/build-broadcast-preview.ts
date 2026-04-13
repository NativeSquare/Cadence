const LOGO_URL = "https://cadence.nativesquare.fr/cadence-logo.png";

/** Converts Tiptap's semantic HTML into email-safe inline-styled HTML. */
export function inlineEmailStyles(html: string): string {
  return html
    .replace(/<p>/g, '<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#797979;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">')
    .replace(/<h1>/g, '<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#131313;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">')
    .replace(/<h2>/g, '<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#131313;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">')
    .replace(/<h3>/g, '<h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#131313;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">')
    .replace(/<strong>/g, '<strong style="color:#131313;">')
    .replace(/<a /g, '<a style="color:#98fe00;text-decoration:underline;" ')
    .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:24px;color:#797979;font-size:14px;line-height:1.7;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:24px;color:#797979;font-size:14px;line-height:1.7;">')
    .replace(/<li>/g, '<li style="margin:0 0 4px;">')
    .replace(/<blockquote>/g, '<blockquote style="margin:0 0 16px;padding-left:16px;border-left:3px solid #98fe00;color:#797979;font-style:italic;">')
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">');
}

/** Wraps body HTML in the branded Cadence email shell. Client-side mirror of the server function. */
export function buildBroadcastPreviewHtml(bodyHtml: string): string {
  const styledBody = inlineEmailStyles(bodyHtml);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f3f3;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding-bottom:40px;">
          <img src="${LOGO_URL}" alt="Cadence" width="44" height="44" style="border-radius:12px;display:block;margin:0 auto;">
          <p style="margin:12px 0 0;font-size:26px;font-weight:700;color:#131313;letter-spacing:-0.04em;line-height:1;">cadence</p>
        </td></tr>

        <!-- Content card -->
        <tr><td style="background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">
          ${styledBody}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-size:11px;color:#b4b4b4;line-height:1.6;">&copy; 2026 Cadence &middot; NativeSquare SAS &middot; 60 rue Fran&ccedil;ois 1er, 75008 Paris</p>
          <p style="margin:8px 0 0;font-size:11px;"><a href="#" style="color:#b4b4b4;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
