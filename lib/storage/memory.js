import { StorageAdapter } from "./interface.js";

/**
 * Process-Local In-Memory Storage Adapter
 *
 * Intended strictly for local development and automated testing.
 * NOT suitable for multi-instance production environments.
 */
export class MemoryStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.challenges = new Map();
    this.sessions = new Map();
  }

  async saveChallenge({ challengeId, nonce, address, chainId, ttlSeconds }) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.challenges.set(challengeId, {
      challengeId,
      nonce,
      address: address.toLowerCase(),
      chainId,
      expiresAt,
    });
  }

  async consumeChallenge(challengeId) {
    const entry = this.challenges.get(challengeId);
    if (!entry) return null;

    // Remove immediately to ensure atomic single-use consumption
    this.challenges.delete(challengeId);

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      return null;
    }

    return {
      challengeId: entry.challengeId,
      nonce: entry.nonce,
      address: entry.address,
      chainId: entry.chainId,
    };
  }

  async createSession({
    sessionTokenHash,
    address,
    chainId,
    createdAt,
    expiresAt,
    ttlSeconds,
  }) {
    const numericExpiry = Date.now() + ttlSeconds * 1000;
    this.sessions.set(sessionTokenHash, {
      address,
      chainId,
      createdAt,
      expiresAt,
      numericExpiry,
    });
  }

  async getSession(sessionTokenHash) {
    const session = this.sessions.get(sessionTokenHash);
    if (!session) return null;

    if (Date.now() > session.numericExpiry) {
      this.sessions.delete(sessionTokenHash);
      return null;
    }

    return {
      address: session.address,
      chainId: session.chainId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  async revokeSession(sessionTokenHash) {
    this.sessions.delete(sessionTokenHash);
  }

  /**
   * Helper for tests to inspect store state
   */
  clear() {
    this.challenges.clear();
    this.sessions.clear();
  }
}
