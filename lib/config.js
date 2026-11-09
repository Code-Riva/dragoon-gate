/**
 * Trusted Application Configuration
 * Derives expected domain and URI from trusted configuration rather than
 * arbitrary client-forwarded headers.
 */

export function getAppConfig() {
  const origin =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    "http://localhost:3000";

  let domain = process.env.APP_DOMAIN;
  if (!domain) {
    try {
      const url = new URL(origin);
      domain = url.host; // e.g. "localhost:3000" or "dragoonsgate.example.com"
    } catch {
      domain = "localhost:3000";
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  return {
    origin,
    domain,
    isProduction,
    // Challenge validity window: 5 minutes (300 seconds)
    challengeTtlSeconds: 300,
    // Session validity window: 24 hours (86400 seconds)
    sessionTtlSeconds: 86400,
    // Cookie names
    sessionCookieName: "dg_session",
    challengeCookieName: "dg_challenge",
  };
}
