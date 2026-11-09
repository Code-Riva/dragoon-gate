import Redis from "ioredis";
import { StorageAdapter } from "./interface.js";

/**
 * Shared Redis Storage Adapter
 *
 * Production-ready storage adapter providing atomic single-use challenge consumption
 * and distributed session revocation across serverless / multi-instance nodes.
 */
export class RedisStorageAdapter extends StorageAdapter {
  constructor(redisUrl, options = {}) {
    super();
    if (!redisUrl) {
      throw new Error(
        "RedisStorageAdapter requires a valid REDIS_URL connection string."
      );
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      ...options,
    });

    // Define atomic challenge consumption Lua script
    // Gets the challenge payload and deletes it atomically in a single transaction
    this.client.defineCommand("consumeChallengeAtomic", {
      numberOfKeys: 1,
      lua: `
        local val = redis.call('get', KEYS[1])
        if val then
          redis.call('del', KEYS[1])
        end
        return val
      `,
    });
  }

  async ensureConnected() {
    if (this.client.status === "wait" || this.client.status === "close") {
      await this.client.connect();
    }
  }

  async saveChallenge({ challengeId, nonce, address, chainId, ttlSeconds }) {
    await this.ensureConnected();
    const key = `challenge:${challengeId}`;
    const payload = JSON.stringify({
      challengeId,
      nonce,
      address: address.toLowerCase(),
      chainId,
    });

    // SETEX key ttlSeconds value
    await this.client.set(key, payload, "EX", ttlSeconds);
  }

  async consumeChallenge(challengeId) {
    await this.ensureConnected();
    const key = `challenge:${challengeId}`;

    // Atomically retrieve and delete using Lua
    const raw = await this.client.consumeChallengeAtomic(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async createSession({
    sessionTokenHash,
    address,
    chainId,
    createdAt,
    expiresAt,
    ttlSeconds,
  }) {
    await this.ensureConnected();
    const key = `session:${sessionTokenHash}`;
    const payload = JSON.stringify({
      address,
      chainId,
      createdAt,
      expiresAt,
    });

    await this.client.set(key, payload, "EX", ttlSeconds);
  }

  async getSession(sessionTokenHash) {
    await this.ensureConnected();
    const key = `session:${sessionTokenHash}`;
    const raw = await this.client.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async revokeSession(sessionTokenHash) {
    await this.ensureConnected();
    const key = `session:${sessionTokenHash}`;
    await this.client.del(key);
  }
}
