"use node";

import crypto from "crypto";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const HMAC_SECRET_ENV = "UNSUBSCRIBE_HMAC_SECRET";

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env[HMAC_SECRET_ENV];
  if (!secret) throw new Error("UNSUBSCRIBE_HMAC_SECRET env var is not set");
  return crypto.createHmac("sha256", secret).update(email).digest("hex");
}

export function verifyUnsubscribeToken(
  email: string,
  token: string
): boolean {
  const expected = generateUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(token, "hex")
  );
}

export function generateUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) throw new Error("CONVEX_SITE_URL is not set");
  return `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/** Verify the unsubscribe token and mark the contact as unsubscribed. */
export const handleUnsubscribe = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!verifyUnsubscribeToken(args.email, args.token)) {
      return false;
    }
    await ctx.runMutation(internal.contacts.processUnsubscribe, {
      email: args.email,
    });
    return true;
  },
});
