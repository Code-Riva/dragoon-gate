/**
 * Storage Interface Contract
 *
 * Defines the required storage operations for challenges and sessions.
 * Production implementations MUST guarantee atomic consumption of challenges
 * and instant revocation of sessions across instances.
 */

export class StorageAdapter {
  /**
   * Save a freshly issued login challenge.
   * @param {Object} params
   * @param {string} params.challengeId - Unique opaque challenge identifier
   * @param {string} params.nonce - EIP-4361 nonce
   * @param {string} params.address - Lowercased Ethereum address
   * @param {number} params.chainId - Target chain ID
   * @param {number} params.ttlSeconds - Time-to-live in seconds
   * @returns {Promise<void>}
   */
  async saveChallenge({ challengeId, nonce, address, chainId, ttlSeconds }) {
    throw new Error("Method not implemented.");
  }

  /**
   * Atomically retrieve and consume a challenge.
   * If the challenge exists and has not expired, it MUST be removed immediately so
   * that concurrent or subsequent calls return null.
   *
   * @param {string} challengeId - Unique challenge identifier
   * @returns {Promise<{challengeId: string, nonce: string, address: string, chainId: number} | null>}
   */
  async consumeChallenge(challengeId) {
    throw new Error("Method not implemented.");
  }

  /**
   * Store a newly authenticated session.
   * Stores ONLY the SHA-256 hash of the session token.
   *
   * @param {Object} params
   * @param {string} params.sessionTokenHash - SHA-256 hash of the opaque session token
   * @param {string} params.address - Checksummed or verified Ethereum address
   * @param {number} params.chainId - Chain ID at sign-in
   * @param {string} params.createdAt - ISO timestamp
   * @param {string} params.expiresAt - ISO timestamp
   * @param {number} params.ttlSeconds - Time-to-live in seconds
   * @returns {Promise<void>}
   */
  async createSession({
    sessionTokenHash,
    address,
    chainId,
    createdAt,
    expiresAt,
    ttlSeconds,
  }) {
    throw new Error("Method not implemented.");
  }

  /**
   * Retrieve active session data by session token hash.
   * @param {string} sessionTokenHash
   * @returns {Promise<{address: string, chainId: number, createdAt: string, expiresAt: string} | null>}
   */
  async getSession(sessionTokenHash) {
    throw new Error("Method not implemented.");
  }

  /**
   * Revoke and delete a session immediately.
   * @param {string} sessionTokenHash
   * @returns {Promise<void>}
   */
  async revokeSession(sessionTokenHash) {
    throw new Error("Method not implemented.");
  }
}
