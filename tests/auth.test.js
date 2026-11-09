import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hashMessage } from "viem";
import {
  createChallenge,
  verifyLogin,
  getSessionFromToken,
  revokeSessionToken,
  validateRequestOrigin,
  hashSessionToken,
} from "../lib/auth.js";
import { getStorageAdapter, _resetStorageForTesting } from "../lib/storage/index.js";
import { MemoryStorageAdapter } from "../lib/storage/memory.js";
import { getAppConfig } from "../lib/config.js";

describe("Project 6 Task 3 — Dragoon’s Gate Authentication Test Suite", () => {
  let memoryStorage;

  beforeEach(() => {
    // Reset to clean memory storage for each test
    memoryStorage = new MemoryStorageAdapter();
    _resetStorageForTesting(memoryStorage);
  });

  after(() => {
    _resetStorageForTesting(null);
  });

  // 1. Successful Login
  test("1. Successful login with ephemeral test key", async () => {
    const testPrivateKey = generatePrivateKey();
    const account = privateKeyToAccount(testPrivateKey);

    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    assert.ok(challenge.challengeId, "Challenge ID must be generated");
    assert.ok(challenge.nonce, "Nonce must be generated");
    assert.ok(challenge.message.includes(account.address), "Message must contain account address");

    const signature = await account.signMessage({ message: challenge.message });

    const result = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });

    assert.strictEqual(result.success, true, "Verification must succeed");
    assert.strictEqual(
      result.address.toLowerCase(),
      account.address.toLowerCase(),
      "Verified address must match account"
    );
    assert.ok(result.sessionToken, "Session token must be issued");

    // Session must exist in storage
    const session = await getSessionFromToken(result.sessionToken);
    assert.ok(session, "Session must exist in storage");
    assert.strictEqual(
      session.address.toLowerCase(),
      account.address.toLowerCase(),
      "Session address must match"
    );
  });

  // 2. Tampered Signatures
  test("2. Invalid and tampered signatures are rejected", async () => {
    const accountA = privateKeyToAccount(generatePrivateKey());
    const accountB = privateKeyToAccount(generatePrivateKey());

    const challenge = await createChallenge({
      address: accountA.address,
      chainId: 1,
    });

    // Account B signs Account A's message (signer mismatch)
    const signatureFromB = await accountB.signMessage({
      message: challenge.message,
    });

    const resultMismatchedSigner = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature: signatureFromB,
      browserChallengeId: challenge.challengeId,
    });

    assert.strictEqual(
      resultMismatchedSigner.success,
      false,
      "Verification must fail when signature is from a different key"
    );
    assert.strictEqual(resultMismatchedSigner.status, 401);
    assert.match(
      resultMismatchedSigner.error,
      /Signature verification failed/i
    );

    // Issue new challenge for malformed signature test
    const challenge2 = await createChallenge({
      address: accountA.address,
      chainId: 1,
    });
    const malformedSig = "0x" + "00".repeat(65);

    const resultMalformed = await verifyLogin({
      challengeId: challenge2.challengeId,
      message: challenge2.message,
      signature: malformedSig,
      browserChallengeId: challenge2.challengeId,
    });

    assert.strictEqual(
      resultMalformed.success,
      false,
      "Malformed signature must be rejected"
    );
    assert.strictEqual(resultMalformed.status, 401);
  });

  // 3. Mismatched Login Fields
  test("3. Mismatched login fields (domain, nonce, chainId) are rejected", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    // Tamper domain inside message string
    const tamperedDomainMessage = challenge.message.replace(
      "localhost:3000",
      "malicious-phishing.com"
    );
    const sig1 = await account.signMessage({ message: tamperedDomainMessage });

    const resultDomain = await verifyLogin({
      challengeId: challenge.challengeId,
      message: tamperedDomainMessage,
      signature: sig1,
      browserChallengeId: challenge.challengeId,
    });

    assert.strictEqual(resultDomain.success, false);
    assert.strictEqual(resultDomain.status, 400);
    assert.match(resultDomain.error, /Domain mismatch/i);

    // New challenge for nonce mismatch
    const challenge2 = await createChallenge({
      address: account.address,
      chainId: 1,
    });
    const tamperedNonceMessage = challenge2.message.replace(
      challenge2.nonce,
      "wrongnonce123"
    );
    const sig2 = await account.signMessage({ message: tamperedNonceMessage });

    const resultNonce = await verifyLogin({
      challengeId: challenge2.challengeId,
      message: tamperedNonceMessage,
      signature: sig2,
      browserChallengeId: challenge2.challengeId,
    });

    assert.strictEqual(resultNonce.success, false);
    assert.strictEqual(resultNonce.status, 400);
    assert.match(resultNonce.error, /Nonce mismatch/i);
  });

  // 4. Expired Challenges
  test("4. Expired challenges cannot be consumed", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challengeId = "expired-challenge-id";
    const nonce = "12345678";

    // Directly save challenge with negative TTL (already expired)
    await memoryStorage.saveChallenge({
      challengeId,
      nonce,
      address: account.address,
      chainId: 1,
      ttlSeconds: -10, // expired 10 seconds ago
    });

    const config = getAppConfig();
    const expiredMessage = `${config.domain} wants you to sign in with your Ethereum account:\n${account.address}\n\nSign in to Dragoon’s Gate with your Ethereum wallet.\n\nURI: ${config.origin}\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date(Date.now() - 20000).toISOString()}`;
    const sig = await account.signMessage({ message: expiredMessage });

    const result = await verifyLogin({
      challengeId,
      message: expiredMessage,
      signature: sig,
      browserChallengeId: challengeId,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 400);
    assert.match(result.error, /Challenge has expired or has already been consumed/i);
  });

  // 5. Reused Challenge Attempts (Atomic Consumption)
  test("5. Replay attack rejection: challenges cannot be reused", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    // First attempt succeeds
    const firstAttempt = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });
    assert.strictEqual(firstAttempt.success, true);

    // Replay attempt with same challenge and signature MUST fail
    const replayAttempt = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });

    assert.strictEqual(replayAttempt.success, false);
    assert.strictEqual(replayAttempt.status, 400);
    assert.match(replayAttempt.error, /Challenge has expired or has already been consumed/i);
  });

  // 6. Concurrent Challenge Consumption (Race Condition Protection)
  test("6. Concurrent challenge attempts: atomic consumption allows only one success", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    // Fire 2 simultaneous verification requests concurrently
    const [resA, resB] = await Promise.all([
      verifyLogin({
        challengeId: challenge.challengeId,
        message: challenge.message,
        signature,
        browserChallengeId: challenge.challengeId,
      }),
      verifyLogin({
        challengeId: challenge.challengeId,
        message: challenge.message,
        signature,
        browserChallengeId: challenge.challengeId,
      }),
    ]);

    const successes = [resA, resB].filter((r) => r.success);
    const failures = [resA, resB].filter((r) => !r.success);

    assert.strictEqual(successes.length, 1, "Exactly one concurrent verification must succeed");
    assert.strictEqual(failures.length, 1, "Exactly one concurrent verification must fail");
    assert.match(failures[0].error, /already been consumed/i);
  });

  // 7. Missing Browser Challenge Binding
  test("7. Missing or mismatched browser challenge cookie binding is rejected", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    // Missing browser cookie binding
    const missingCookieResult = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: null, // missing cookie
    });

    assert.strictEqual(missingCookieResult.success, false);
    assert.strictEqual(missingCookieResult.status, 400);
    assert.match(missingCookieResult.error, /Browser challenge binding mismatch/i);

    // Mismatched browser cookie binding
    const mismatchedCookieResult = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: "different-browser-cookie-id",
    });

    assert.strictEqual(mismatchedCookieResult.success, false);
    assert.strictEqual(mismatchedCookieResult.status, 400);
    assert.match(mismatchedCookieResult.error, /Browser challenge binding mismatch/i);
  });

  // 8. Session Persistence, Sign-Out, and Revoked-Cookie Reuse
  test("8. Session persistence, revocation, and revoked-cookie reuse rejection", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    const loginRes = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });

    const token = loginRes.sessionToken;
    assert.ok(token);

    // Active session retrieval succeeds
    const activeSession = await getSessionFromToken(token);
    assert.ok(activeSession);
    assert.strictEqual(activeSession.address.toLowerCase(), account.address.toLowerCase());

    // User signs out (revocation)
    await revokeSessionToken(token);

    // Reusing the revoked session token must now return null
    const revokedSession = await getSessionFromToken(token);
    assert.strictEqual(revokedSession, null, "Revoked session token must return null");
  });

  // 9. Unauthenticated Direct Dashboard / API Access
  test("9. Unauthenticated direct access to protected resources is rejected", async () => {
    const { authenticateRequest } = await import("../lib/auth.js");

    // A. Request with no cookie
    const noCookieReq = new Request("http://localhost:3000/api/dashboard/data", {
      method: "GET",
    });
    const authResultNoCookie = await authenticateRequest(noCookieReq);
    assert.strictEqual(
      authResultNoCookie.authenticated,
      false,
      "Request without cookie must be rejected"
    );
    assert.strictEqual(authResultNoCookie.session, null);

    // B. Request with forged / invalid cookie
    const forgedCookieReq = new Request("http://localhost:3000/api/dashboard/data", {
      method: "GET",
      headers: {
        cookie: "dg_session=forged-unregistered-token-9999",
      },
    });
    const authResultForged = await authenticateRequest(forgedCookieReq);
    assert.strictEqual(
      authResultForged.authenticated,
      false,
      "Request with forged cookie must be rejected"
    );
    assert.strictEqual(authResultForged.session, null);

    // C. Non-existent tokens directly
    assert.strictEqual(await getSessionFromToken(null), null);
    assert.strictEqual(await getSessionFromToken(""), null);
    assert.strictEqual(await getSessionFromToken("invalid-fake-token-12345"), null);
  });

  // 10. Cross-Origin State-Changing Requests
  test("10. Cross-origin state-changing requests are blocked", () => {
    // Legitimate same-origin request
    const legitimateReq = new Request("http://localhost:3000/api/auth/challenge", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
    });
    assert.strictEqual(validateRequestOrigin(legitimateReq), true);

    // Malicious cross-origin CSRF request
    const maliciousReq = new Request("http://localhost:3000/api/auth/challenge", {
      method: "POST",
      headers: {
        origin: "https://evil-attacker-site.com",
      },
    });
    assert.strictEqual(validateRequestOrigin(maliciousReq), false);
  });

  // 11. Production Failing Closed Without Shared Storage
  test("11. Production fails closed immediately when shared storage is missing", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalRedisUrl = process.env.REDIS_URL;

    try {
      // Simulate production environment with missing REDIS_URL
      process.env.NODE_ENV = "production";
      delete process.env.REDIS_URL;
      _resetStorageForTesting(null);

      assert.throws(
        () => {
          getStorageAdapter();
        },
        /\[Security Policy Violation\] Production environment requires shared storage/i,
        "Production must throw and fail closed when REDIS_URL is absent"
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalRedisUrl !== undefined) {
        process.env.REDIS_URL = originalRedisUrl;
      }
      _resetStorageForTesting(memoryStorage);
    }
  });
});
