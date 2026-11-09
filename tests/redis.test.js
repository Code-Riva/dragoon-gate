import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import Redis from "ioredis";
import {
  createChallenge,
  verifyLogin,
  getSessionFromToken,
  revokeSessionToken,
  authenticateRequest,
  hashSessionToken,
} from "../lib/auth.js";
import { getStorageAdapter, _resetStorageForTesting } from "../lib/storage/index.js";
import { RedisStorageAdapter } from "../lib/storage/redis.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

describe("Dragoon’s Gate — Real Redis Authentication Verification Suite", () => {
  let redisAdapter;
  let rawClient;
  let isRedisAvailable = false;

  before(async () => {
    rawClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });

    // Suppress unhandled error log when Redis is offline
    rawClient.on("error", () => {});

    try {
      await rawClient.connect();
      const ping = await rawClient.ping();
      if (ping === "PONG") {
        isRedisAvailable = true;
        redisAdapter = new RedisStorageAdapter(REDIS_URL);
        _resetStorageForTesting(redisAdapter);
      }
    } catch {
      console.warn(`[Notice] Redis server not detected at ${REDIS_URL}. Live Redis test suite will be skipped.`);
      isRedisAvailable = false;
    }
  });

  after(async () => {
    _resetStorageForTesting(null);
    if (redisAdapter?.client) {
      try {
        await redisAdapter.client.quit();
      } catch {}
    }
    if (rawClient) {
      try {
        await rawClient.quit();
      } catch {}
    }
  });

  beforeEach(async () => {
    if (!isRedisAvailable) return;
    const testKeys = await rawClient.keys("challenge:*");
    const sessionKeys = await rawClient.keys("session:*");
    const allKeys = [...testKeys, ...sessionKeys];
    if (allKeys.length > 0) {
      await rawClient.del(...allKeys);
    }
  });

  // 1. Storage & Expiration in Real Redis
  test("1. Challenge is stored in real Redis with valid TTL and serialized data", async (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    assert.ok(challenge.challengeId);
    assert.ok(challenge.nonce);

    // Verify key in real Redis directly via raw client
    const redisKey = `challenge:${challenge.challengeId}`;
    const rawData = await rawClient.get(redisKey);
    assert.ok(rawData, "Challenge key must exist in real Redis");

    const parsed = JSON.parse(rawData);
    assert.strictEqual(parsed.challengeId, challenge.challengeId);
    assert.strictEqual(parsed.nonce, challenge.nonce);
    assert.strictEqual(parsed.address, account.address.toLowerCase());
    assert.strictEqual(parsed.chainId, 1);

    const ttl = await rawClient.ttl(redisKey);
    assert.ok(ttl > 0 && ttl <= 300, `TTL must be within 300s window, got ${ttl}`);
  });

  // 2. Successful Login & Session Storage in Real Redis
  test("2. Successful cryptographic login creates session in real Redis with 24h TTL", async (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    const result = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.address.toLowerCase(), account.address.toLowerCase());
    assert.ok(result.sessionToken);

    // Challenge must be deleted from Redis immediately upon consumption
    const consumedChallenge = await rawClient.get(`challenge:${challenge.challengeId}`);
    assert.strictEqual(consumedChallenge, null, "Consumed challenge must be removed from Redis");

    // Session must exist in Redis
    const tokenHash = hashSessionToken(result.sessionToken);
    const sessionRaw = await rawClient.get(`session:${tokenHash}`);
    assert.ok(sessionRaw, "Session key must exist in real Redis");

    const sessionData = JSON.parse(sessionRaw);
    assert.strictEqual(sessionData.address.toLowerCase(), account.address.toLowerCase());
    assert.strictEqual(sessionData.chainId, 1);

    const sessionTtl = await rawClient.ttl(`session:${tokenHash}`);
    assert.ok(sessionTtl > 86000 && sessionTtl <= 86400, "Session TTL must be ~24 hours");

    // Retrieve through application helper
    const session = await getSessionFromToken(result.sessionToken);
    assert.ok(session);
    assert.strictEqual(session.address.toLowerCase(), account.address.toLowerCase());
  });

  // 3. Concurrent Nonce Consumption in Real Redis (Atomic Lua Script)
  test("3. Concurrent nonce consumption: atomic Lua script guarantees exactly one success", async (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    // Launch 5 simultaneous verification attempts for the exact same challenge
    const attempts = await Promise.all([
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
      verifyLogin({
        challengeId: challenge.challengeId,
        message: challenge.message,
        signature,
        browserChallengeId: challenge.challengeId,
      }),
    ]);

    const successes = attempts.filter((r) => r.success);
    const failures = attempts.filter((r) => !r.success);

    assert.strictEqual(successes.length, 1, "Exactly one concurrent attempt must succeed in Redis");
    assert.strictEqual(failures.length, 4, "Remaining 4 concurrent attempts must fail in Redis");

    for (const fail of failures) {
      assert.strictEqual(fail.status, 400);
      assert.match(fail.error, /already been consumed/i);
    }
  });

  // 4. Replay Attack Prevention in Real Redis
  test("4. Replay attack rejection: challenge cannot be reused once consumed from Redis", async (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
    const account = privateKeyToAccount(generatePrivateKey());
    const challenge = await createChallenge({
      address: account.address,
      chainId: 1,
    });

    const signature = await account.signMessage({ message: challenge.message });

    const first = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });
    assert.strictEqual(first.success, true);

    // Immediate second attempt with identical parameters
    const replay = await verifyLogin({
      challengeId: challenge.challengeId,
      message: challenge.message,
      signature,
      browserChallengeId: challenge.challengeId,
    });
    assert.strictEqual(replay.success, false);
    assert.strictEqual(replay.status, 400);
    assert.match(replay.error, /already been consumed/i);
  });

  // 5. Session Revocation in Real Redis
  test("5. Session revocation immediately deletes key from real Redis and invalidates reuse", async (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
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
    const tokenHash = hashSessionToken(token);

    // Verify key exists in Redis
    assert.ok(await rawClient.get(`session:${tokenHash}`));

    // Revoke session
    await revokeSessionToken(token);

    // Verify key deleted from Redis
    const deletedInRedis = await rawClient.get(`session:${tokenHash}`);
    assert.strictEqual(deletedInRedis, null, "Session key must be deleted from real Redis");

    // Verification via getSessionFromToken must return null
    const session = await getSessionFromToken(token);
    assert.strictEqual(session, null, "Revoked session must return null");

    // Verification via authenticateRequest helper must reject
    const mockReq = new Request("http://localhost:3000/api/dashboard/data", {
      headers: { cookie: `dg_session=${token}` },
    });
    const authResult = await authenticateRequest(mockReq);
    assert.strictEqual(authResult.authenticated, false);
    assert.strictEqual(authResult.session, null);
  });

  // 6. Production Mode Compatibility with Real Redis
  test("6. Production mode activates RedisStorageAdapter without failing closed", (t) => {
    if (!isRedisAvailable) {
      t.skip("Redis server not available");
      return;
    }
    const originalEnv = process.env.NODE_ENV;
    const originalRedisUrl = process.env.REDIS_URL;

    try {
      process.env.NODE_ENV = "production";
      process.env.REDIS_URL = REDIS_URL;
      _resetStorageForTesting(null);

      const adapter = getStorageAdapter();
      assert.ok(adapter instanceof RedisStorageAdapter, "Adapter must be an instance of RedisStorageAdapter");
      assert.ok(adapter.client, "Redis client must be initialized");
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalRedisUrl !== undefined) {
        process.env.REDIS_URL = originalRedisUrl;
      } else {
        delete process.env.REDIS_URL;
      }
      _resetStorageForTesting(redisAdapter);
    }
  });
});
