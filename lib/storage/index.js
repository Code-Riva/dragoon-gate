import { MemoryStorageAdapter } from "./memory.js";
import { RedisStorageAdapter } from "./redis.js";

let storageInstance = null;

/**
 * Get or initialize the configured storage adapter.
 *
 * Enforces production security boundaries:
 * - If in production, requires a shared storage connection (REDIS_URL).
 * - Fails closed immediately if missing in production.
 * - In development or test, falls back to process-local MemoryStorageAdapter with clear notice.
 */
export function getStorageAdapter() {
  if (storageInstance) {
    return storageInstance;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const redisUrl = process.env.REDIS_URL;

  if (isProduction) {
    if (!redisUrl) {
      throw new Error(
        "[Security Policy Violation] Production environment requires shared storage. " +
          "REDIS_URL environment variable is missing. Failing closed to prevent replay vulnerabilities."
      );
    }
    storageInstance = new RedisStorageAdapter(redisUrl);
    return storageInstance;
  }

  // Development / Test environment
  if (redisUrl) {
    storageInstance = new RedisStorageAdapter(redisUrl);
    return storageInstance;
  }

  // Fallback to in-memory adapter for development/tests
  storageInstance = new MemoryStorageAdapter();
  return storageInstance;
}

/**
 * Reset storage instance (used exclusively in test suites)
 */
export function _resetStorageForTesting(newAdapter = null) {
  storageInstance = newAdapter;
}
