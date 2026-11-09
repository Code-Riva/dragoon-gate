import crypto from "node:crypto";
import { getAddress, hashMessage, recoverAddress } from "viem";
import {
  createSiweMessage,
  parseSiweMessage,
  validateSiweMessage,
  generateSiweNonce,
} from "viem/siwe";
import { getAppConfig } from "./config.js";
import { getStorageAdapter } from "./storage/index.js";

export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate that state-changing request origins match trusted application configuration.
 */
export function validateRequestOrigin(request) {
  const config = getAppConfig();
  const origin = request.headers.get("origin");

  // In production or when origin header is present, it must match configured origin
  if (origin) {
    try {
      const expectedUrl = new URL(config.origin);
      const reqUrl = new URL(origin);
      return reqUrl.origin.toLowerCase() === expectedUrl.origin.toLowerCase();
    } catch {
      return false;
    }
  }

  // Same-origin standard requests without origin header (e.g. some internal same-origin fetch)
  const host = request.headers.get("host");
  if (host) {
    return host.toLowerCase() === config.domain.toLowerCase();
  }

  return true;
}

/**
 * Issue a fresh, unpredictable, short-lived challenge bound to the browser.
 */
export async function createChallenge({ address, chainId }) {
  const config = getAppConfig();
  const storage = getStorageAdapter();

  // Validate Ethereum address formatting
  let checksummedAddress;
  try {
    checksummedAddress = getAddress(address);
  } catch {
    throw new Error("Invalid Ethereum address provided.");
  }

  const numericChainId = Number(chainId) || 1;
  const challengeId = crypto.randomBytes(24).toString("hex");
  const nonce = generateSiweNonce();
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + config.challengeTtlSeconds * 1000).toISOString();

  // Construct standard EIP-4361 message string
  const message = createSiweMessage({
    domain: config.domain,
    address: checksummedAddress,
    statement: "Sign in to Dragoon’s Gate with your Ethereum wallet.",
    uri: config.origin,
    version: "1",
    chainId: numericChainId,
    nonce,
    issuedAt: new Date(issuedAt),
    expirationTime: new Date(expiresAt),
  });

  // Save to storage
  await storage.saveChallenge({
    challengeId,
    nonce,
    address: checksummedAddress,
    chainId: numericChainId,
    ttlSeconds: config.challengeTtlSeconds,
  });

  return {
    challengeId,
    message,
    nonce,
    expiresAt,
  };
}

/**
 * Validate EIP-4361 signature, atomically consume challenge, and create authenticated session.
 */
export async function verifyLogin({
  challengeId,
  message,
  signature,
  browserChallengeId,
}) {
  const config = getAppConfig();
  const storage = getStorageAdapter();

  if (!challengeId || !message || !signature) {
    return {
      success: false,
      status: 400,
      error: "Missing required verification fields (challengeId, message, or signature).",
    };
  }

  // 1. Enforce browser-challenge binding cookie
  if (!browserChallengeId || browserChallengeId !== challengeId) {
    return {
      success: false,
      status: 400,
      error:
        "Browser challenge binding mismatch. Verification must occur in the same browser session that requested the challenge.",
    };
  }

  // 2. Atomically retrieve and consume challenge (single-use guarantee)
  const challenge = await storage.consumeChallenge(challengeId);
  if (!challenge) {
    return {
      success: false,
      status: 400,
      error:
        "Challenge has expired or has already been consumed. Please request a fresh sign-in challenge.",
    };
  }

  // 3. Parse and validate EIP-4361 message fields
  let parsed;
  try {
    parsed = parseSiweMessage(message);
  } catch {
    return {
      success: false,
      status: 400,
      error: "Malformed EIP-4361 message.",
    };
  }

  if (!parsed || !parsed.address || !parsed.nonce) {
    return {
      success: false,
      status: 400,
      error: "Invalid or incomplete EIP-4361 message.",
    };
  }

  // Validate exact parameters against challenge and trusted configuration
  if (parsed.domain.toLowerCase() !== config.domain.toLowerCase()) {
    return {
      success: false,
      status: 400,
      error: `Domain mismatch: message domain '${parsed.domain}' does not match expected '${config.domain}'.`,
    };
  }

  if (parsed.uri.toLowerCase() !== config.origin.toLowerCase()) {
    return {
      success: false,
      status: 400,
      error: `URI mismatch: message URI '${parsed.uri}' does not match expected '${config.origin}'.`,
    };
  }

  if (parsed.nonce !== challenge.nonce) {
    return {
      success: false,
      status: 400,
      error: "Nonce mismatch: message nonce does not match issued challenge.",
    };
  }

  if (parsed.address.toLowerCase() !== challenge.address.toLowerCase()) {
    return {
      success: false,
      status: 400,
      error: "Address mismatch: message address does not match challenge address.",
    };
  }

  if (Number(parsed.chainId) !== Number(challenge.chainId)) {
    return {
      success: false,
      status: 400,
      error: "Chain ID mismatch: message chain does not match challenge chain.",
    };
  }

  if (parsed.version !== "1") {
    return {
      success: false,
      status: 400,
      error: "Unsupported SIWE version: only version 1 is supported.",
    };
  }

  // Validate timestamps
  const now = Date.now();
  if (parsed.expirationTime && new Date(parsed.expirationTime).getTime() < now) {
    return {
      success: false,
      status: 400,
      error: "Login message has expired.",
    };
  }

  // Check issuedAt is not in future (allow 60s clock skew)
  if (parsed.issuedAt && new Date(parsed.issuedAt).getTime() > now + 60000) {
    return {
      success: false,
      status: 400,
      error: "Message issued-at timestamp is in the future.",
    };
  }

  // Run viem SIWE standard validator
  const isSiweValid = validateSiweMessage({
    message: parsed,
    domain: config.domain,
    nonce: challenge.nonce,
  });

  if (!isSiweValid) {
    return {
      success: false,
      status: 400,
      error: "SIWE message structural validation failed.",
    };
  }

  // 4. Verify cryptographic signature for Externally Owned Accounts (EOA)
  let recoveredAddress = null;
  try {
    recoveredAddress = await recoverAddress({
      hash: hashMessage(message),
      signature,
    });
  } catch {
    return {
      success: false,
      status: 401,
      error:
        "Signature verification failed. Note: Smart contract wallets (ERC-1271) are currently unsupported in this milestone.",
    };
  }

  if (
    !recoveredAddress ||
    recoveredAddress.toLowerCase() !== parsed.address.toLowerCase()
  ) {
    return {
      success: false,
      status: 401,
      error:
        "Signature verification failed: recovered signer does not match claiming address. Note: Smart contract wallets (ERC-1271) are currently unsupported in this milestone.",
    };
  }

  // 5. Create new authenticated session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(sessionToken);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + config.sessionTtlSeconds * 1000
  ).toISOString();

  const validatedAddress = getAddress(parsed.address);

  await storage.createSession({
    sessionTokenHash,
    address: validatedAddress,
    chainId: Number(parsed.chainId),
    createdAt,
    expiresAt,
    ttlSeconds: config.sessionTtlSeconds,
  });

  return {
    success: true,
    sessionToken,
    address: validatedAddress,
    chainId: Number(parsed.chainId),
    createdAt,
    expiresAt,
  };
}

/**
 * Validate an active session token from cookie.
 */
export async function getSessionFromToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== "string") {
    return null;
  }

  const storage = getStorageAdapter();
  const tokenHash = hashSessionToken(sessionToken);
  return await storage.getSession(tokenHash);
}

/**
 * Server-enforced protection helper for API endpoints and pages.
 * Validates the session cookie directly against the storage adapter.
 */
export async function authenticateRequest(request) {
  const config = getAppConfig();
  let sessionToken = null;

  if (request.cookies && typeof request.cookies.get === "function") {
    sessionToken = request.cookies.get(config.sessionCookieName)?.value;
  } else if (request.headers && typeof request.headers.get === "function") {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${config.sessionCookieName}=([^;]+)`)
    );
    sessionToken = match ? decodeURIComponent(match[1]) : null;
  }

  if (!sessionToken) {
    return { authenticated: false, session: null };
  }

  const session = await getSessionFromToken(sessionToken);
  if (!session) {
    return { authenticated: false, session: null };
  }

  return { authenticated: true, session };
}

/**
 * Revoke an active session.
 */
export async function revokeSessionToken(sessionToken) {
  if (!sessionToken) return;
  const storage = getStorageAdapter();
  const tokenHash = hashSessionToken(sessionToken);
  await storage.revokeSession(tokenHash);
}
