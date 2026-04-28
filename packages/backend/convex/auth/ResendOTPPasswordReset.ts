import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { APP_DOMAIN, APP_NAME, APP_ADDRESS } from "@packages/shared/constants";
import { Resend as ResendAPI } from "resend";

function buildForgotPasswordHtml(code: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="background-color:#ffffff;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:0 12px;">
    <p style="color:#51525C;font-size:14px;margin:8px 0;">Hi there,</p>
    <p style="color:#51525C;font-size:14px;margin:8px 0;">
      To reset your password, please use the following code:
    </p>
    <p style="color:#51525C;font-size:30px;font-weight:600;margin:24px 0;">
      <strong>${code}</strong>
    </p>
    <p style="color:#51525C;font-size:14px;margin:8px 0;">
      This code will only be valid for the next 5 minutes.
    </p>
    <p style="color:#51525C;font-size:14px;margin:8px 0;">Thanks,</p>
    <p style="color:#51525C;font-size:14px;margin:8px 0;">
      The ${APP_NAME} Team
    </p>
    <hr />
    <p style="color:#51525C;font-size:14px;margin:8px 0;">
      &copy; 2025 ${APP_NAME}, ${APP_ADDRESS}
    </p>
  </div>
</body>
</html>`;
}

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes
  async generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);

    const isDev = process.env.IS_DEV === "true";
    if (isDev) {
      console.log(`[DEV] Email to ${email}: Reset your password`);
      console.log(`[DEV] Verification code: ${token}`);
      return;
    }

    const { error } = await resend.emails.send({
      from: `${APP_NAME} <no-reply@${APP_DOMAIN}>`,
      to: [email],
      subject: "Reset your password",
      html: buildForgotPasswordHtml(token),
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
