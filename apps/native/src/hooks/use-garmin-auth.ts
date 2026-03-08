/**
 * useGarminAuth - Hook for Garmin OAuth 2.0 flow (Soma v0.6.0).
 *
 * Garmin now uses OAuth 2.0 with PKCE. The native app:
 * 1. Generates a PKCE code verifier + challenge
 * 2. Opens Garmin's authorization page in an in-app browser
 * 3. Extracts the authorization code from the redirect
 * 4. Sends code + codeVerifier to the backend for token exchange
 */

import { api } from "@packages/backend/convex/_generated/api";
import { APP_SLUG } from "@packages/shared";
import * as Crypto from "expo-crypto";
import { openAuthSessionAsync } from "expo-web-browser";
import { useAction } from "convex/react";
import { useState } from "react";

const GARMIN_CLIENT_ID = process.env.EXPO_PUBLIC_GARMIN_CLIENT_ID;

const REDIRECT_URI = `${APP_SLUG}://localhost/oauth`;

type GarminAuthResult = {
  connectionId: string;
  synced: {
    activities: number;
    dailies: number;
    sleep: number;
    body: number;
    menstruation: number;
  };
};

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = base64UrlEncode(randomBytes.buffer as ArrayBuffer);

  const digestHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
  );
  const digestBytes = new Uint8Array(
    digestHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const codeChallenge = base64UrlEncode(digestBytes.buffer as ArrayBuffer);

  return { codeVerifier, codeChallenge };
}

export function useGarminAuth() {
  const connectGarmin = useAction(
    api.integrations.garmin.sync.connectGarminOAuth,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (): Promise<GarminAuthResult | null> => {
    if (!GARMIN_CLIENT_ID) {
      setError("Garmin client ID is not configured");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { codeVerifier, codeChallenge } = await generatePKCE();

      const authUrl =
        `https://connect.garmin.com/oauth2Confirm` +
        `?client_id=${GARMIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

      const result = await openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type !== "success") {
        return null;
      }

      const url = new URL(result.url);
      const code = url.searchParams.get("code");

      if (!code) {
        const errorParam = url.searchParams.get("error");
        if (errorParam === "access_denied") {
          setError("Access was denied by the user");
        } else {
          setError("No authorization code received from Garmin");
        }
        return null;
      }

      const connectResult = await connectGarmin({ code, codeVerifier });

      return {
        connectionId: connectResult.connectionId,
        synced: connectResult.synced,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Garmin";
      setError(message);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connect,
    isConnecting,
    error,
  };
}
