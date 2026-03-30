import { describe, expect, it } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
} from "./auth.js";

describe("generateCodeVerifier", () => {
  it("returns a 64-character string by default", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(64);
  });

  it("only contains valid PKCE characters", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it("respects custom length", () => {
    const verifier = generateCodeVerifier(128);
    expect(verifier).toHaveLength(128);
  });

  it("generates unique values", () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });
});

describe("generateState", () => {
  it("returns a 64-character hex string", () => {
    const state = generateState();
    expect(state).toHaveLength(64);
    expect(state).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique values", () => {
    const s1 = generateState();
    const s2 = generateState();
    expect(s1).not.toBe(s2);
  });
});

describe("generateCodeChallenge", () => {
  it("produces a base64url-encoded string", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge).not.toContain("+");
    expect(challenge).not.toContain("/");
    expect(challenge).not.toContain("=");
  });

  it("produces different challenges for different verifiers", async () => {
    const c1 = await generateCodeChallenge("verifier_one_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const c2 = await generateCodeChallenge("verifier_two_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(c1).not.toBe(c2);
  });

  it("produces consistent challenges for the same verifier", async () => {
    const verifier = "consistent_verifier_test_aaaaaaaaaaaaaaaaaa";
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });
});

describe("buildAuthUrl", () => {
  it("builds a valid authorization URL with required params", () => {
    const url = buildAuthUrl({
      clientId: "test-client-id",
      codeChallenge: "test-challenge",
    });

    expect(url).toContain("https://connect.garmin.com/oauth2Confirm?");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain("response_type=code");
    expect(url).toContain("code_challenge=test-challenge");
    expect(url).toContain("code_challenge_method=S256");
  });

  it("includes optional redirect_uri", () => {
    const url = buildAuthUrl({
      clientId: "test-client-id",
      codeChallenge: "test-challenge",
      redirectUri: "https://example.com/callback",
    });

    expect(url).toContain("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback");
  });

  it("includes optional state", () => {
    const url = buildAuthUrl({
      clientId: "test-client-id",
      codeChallenge: "test-challenge",
      state: "my-state-value",
    });

    expect(url).toContain("state=my-state-value");
  });
});
