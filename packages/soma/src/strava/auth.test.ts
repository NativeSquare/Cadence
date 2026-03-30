import { describe, expect, it } from "vitest";
import { buildAuthUrl } from "./auth.js";

describe("buildAuthUrl", () => {
  it("builds a valid Strava authorization URL", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://www.strava.com");
    expect(parsed.pathname).toBe("/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("12345");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://example.com/callback",
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("approval_prompt")).toBe("auto");
    expect(parsed.searchParams.get("scope")).toBe(
      "read,activity:read_all,profile:read_all",
    );
  });

  it("uses custom scope", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
      scope: "read,activity:read",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("scope")).toBe("read,activity:read");
  });

  it("includes state parameter when provided", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
      state: "csrf-token-123",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("state")).toBe("csrf-token-123");
  });

  it("omits state parameter when not provided", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.has("state")).toBe(false);
  });

  it("uses custom baseUrl", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
      baseUrl: "https://strava-mock-server.onrender.com",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://strava-mock-server.onrender.com");
  });

  it("strips trailing slashes from baseUrl", () => {
    const url = buildAuthUrl({
      clientId: "12345",
      redirectUri: "https://example.com/callback",
      baseUrl: "https://mock.example.com///",
    });

    expect(url).toMatch(/^https:\/\/mock\.example\.com\/oauth/);
    expect(url).not.toMatch(/\/\/oauth/);
  });
});
