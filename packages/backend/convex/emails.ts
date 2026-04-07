"use node";

import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/render";
import { internalAction } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { APP_DOMAIN, APP_NAME } from "@packages/shared/constants";

// Initialize the Resend component
// Set testMode: false when ready for production
export const resend = new Resend(components.resend, {
  testMode: process.env.IS_DEV === "true",
});

// Default sender address
const DEFAULT_FROM = `${APP_NAME} <no-reply@${APP_DOMAIN}>`;

/**
 * Generic email sending action that accepts pre-rendered HTML.
 * Use this as a base for specific email actions.
 */
export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
    replyTo: v.optional(v.array(v.string())),
  },
  returns: v.string(), // Returns EmailId
  handler: async (ctx, args) => {
    const emailId = await resend.sendEmail(ctx, {
      from: args.from ?? DEFAULT_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    return emailId;
  },
});

// =============================================================================
// Waitlist Welcome Email (Pure HTML — no React dependency)
// =============================================================================

const LOGO_URL = "https://cadence.run/logo-cadence.svg";

const waitlistCopy = {
  en: {
    subject: `Welcome to ${APP_NAME} — Your spot is confirmed`,
    subtitle: "Elite coaching. For every runner.",
    title: "Your spot is confirmed.",
    body1: "Thank you for your early interest in Cadence. You've secured priority access to a new kind of running coach — one that analyzes your data, adapts your plan in real time, and explains every decision along the way.",
    body2: "As a founding member, you'll benefit from early access before the general launch, exclusive features reserved for our first users, and a direct channel to our team. Your feedback during this phase will actively shape the product.",
    body3: "We're committed to rewarding those who join us from the start. Founding members will always hold a special place in the Cadence community.",
    comingTitle: "What to expect:",
    features: [
      "Personalized training plans with transparent coaching logic",
      "Seamless integration with Garmin, COROS, and Apple Watch",
      "Intelligent daily adjustments based on your readiness",
      "Post-session insights to accelerate your progress",
    ],
    signoff: "Run smart,",
    team: "Max, Alex & Matthieu",
    teamLabel: "The Cadence team",
    footer: (email: string) => `This email was sent to ${email} because you reserved your spot on Cadence.`,
  },
  fr: {
    subject: `Bienvenue sur ${APP_NAME} — Votre place est confirmée`,
    subtitle: "Coaching d'élite. Accessible à tous.",
    title: "Votre place est confirmée.",
    body1: "Merci pour votre intérêt pour Cadence. Vous bénéficiez désormais d'un accès prioritaire à un nouveau type de coach running — un coach qui analyse vos données, adapte votre plan en temps réel, et justifie chacune de ses décisions.",
    body2: "En tant que membre fondateur, vous profiterez d'un accès anticipé avant le lancement officiel, de fonctionnalités exclusives réservées à nos premiers utilisateurs, et d'un canal direct avec notre équipe. Vos retours durant cette phase contribueront activement à façonner le produit.",
    body3: "Nous tenons à récompenser ceux qui nous rejoignent dès le départ. Les membres fondateurs auront toujours une place à part dans la communauté Cadence.",
    comingTitle: "Ce qui vous attend :",
    features: [
      "Plans d'entraînement personnalisés avec logique de coaching transparente",
      "Intégration fluide avec Garmin, COROS et Apple Watch",
      "Ajustements quotidiens intelligents basés sur votre état de forme",
      "Analyses post-séance pour accélérer votre progression",
    ],
    signoff: "Bonne course,",
    team: "Max, Alex & Matthieu",
    teamLabel: "L'équipe Cadence",
    footer: (email: string) => `Cet email a été envoyé à ${email} car vous avez réservé votre place sur Cadence.`,
  },
};

function buildWaitlistHtml(email: string, locale: "en" | "fr"): string {
  const t = waitlistCopy[locale];
  const features = t.features.map((f) => `
    <tr><td style="padding:3px 0;color:#797979;font-size:13px;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <span style="color:#98fe00;">●</span>&nbsp;&nbsp;${f}
    </td></tr>`).join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f3f3;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr><td align="center" style="padding-bottom:40px;">
          <img src="${LOGO_URL}" alt="Cadence" width="44" height="44" style="border-radius:12px;display:block;margin:0 auto;">
          <p style="margin:12px 0 0;font-size:26px;font-weight:700;color:#131313;letter-spacing:-0.04em;line-height:1;">cadence</p>
          <p style="margin:4px 0 0;font-size:12px;color:#797979;letter-spacing:0.08em;">${t.subtitle}</p>
        </td></tr>

        <!-- Content card -->
        <tr><td style="background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">

          <!-- Title -->
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#131313;letter-spacing:-0.02em;">${t.title}</p>

          <!-- Body -->
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#797979;">${t.body1}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#797979;">${t.body2}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#797979;">${t.body3}</p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">

          <!-- Features -->
          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#131313;">${t.comingTitle}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${features}</table>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">

          <!-- Signature -->
          <p style="margin:0 0 8px;font-size:14px;color:#131313;font-style:italic;">${t.signoff}</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#131313;">${t.team}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#b4b4b4;">${t.teamLabel}</p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-size:11px;color:#b4b4b4;line-height:1.6;">${t.footer(email)}</p>
          <p style="margin:8px 0 0;font-size:11px;color:#b4b4b4;">&copy; 2026 ${APP_NAME} &middot; NativeSquare SAS &middot; 60 rue Fran&ccedil;ois 1er, 75008 Paris</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const sendWaitlistEmail = internalAction({
  args: {
    to: v.string(),
    locale: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const locale = args.locale ?? "en";
    const isDev = process.env.IS_DEV === "true";
    if (isDev) {
      console.log(`[DEV] Waitlist welcome email to ${args.to} (locale: ${locale})`);
      return "dev-email-id";
    }

    const html = buildWaitlistHtml(args.to, locale);

    const emailId = await resend.sendEmail(ctx, {
      from: DEFAULT_FROM,
      to: args.to,
      subject: waitlistCopy[locale].subject,
      html,
    });

    return emailId;
  },
});

// =============================================================================
// Admin Invite Email
// =============================================================================

import { AdminInviteEmail } from "@packages/transactional";

export const sendAdminInviteEmail = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    token: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const inviteUrl = `${process.env.ADMIN_URL || "http://localhost:3001"}/accept-invite?token=${args.token}`;

    const isDev = process.env.IS_DEV === "true";
    if (isDev) {
      console.log(`[DEV] Admin invite email to ${args.to}`);
      console.log(`[DEV] Invite URL: ${inviteUrl}`);
      return "dev-email-id";
    }

    const html = await render(
      AdminInviteEmail({
        name: args.name,
        inviteUrl,
      })
    );

    const emailId = await resend.sendEmail(ctx, {
      from: DEFAULT_FROM,
      to: args.to,
      subject: `You're invited to join ${APP_NAME} Admin`,
      html,
    });

    return emailId;
  },
});
