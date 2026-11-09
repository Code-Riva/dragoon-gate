# Dragoon’s Gate — Wallet Sign-In

Dragoon’s Gate is an Ethereum wallet sign-in application that authenticates visitors through cryptographic wallet-message signatures (EIP-4361 / Sign-In with Ethereum) verified server-side, eliminating traditional passwords while requiring zero blockchain transactions and zero network gas.

---

## Features

### Visual Foundation & Layout
* **Immersive Dark Cyber Aesthetic**: Deep indigo-to-black palette (`#6366F1` accent over `#07080d`) with near-black cards, restrained borders, and subtle radial atmosphere.
* **Vector Brand Identity**: Original gate-inspired SVG vector brand mark and visible "Portfolio Demo" header badge.
* **Accessible & Responsive Design**: High-contrast neutral typography, focus-visible keyboard navigation, reduced-motion query support, and fluid layouts optimized for mobile and desktop screens.
* **Educational Architecture**: 3-step breakdown explaining how off-chain message signatures verify identity cryptographically without network gas or fees.

### EIP-6963 Wallet Discovery & Provider Isolation
* **Multi-Injected Provider Discovery**: Standard `eip6963:announceProvider` and `eip6963:requestProvider` event orchestration.
* **Ordered Wallet Picker**: **Brave Wallet → MetaMask → Phantom → Coinbase Wallet**.
* **Exact RDNS Matching**: Prevents silent provider substitution or legacy `isMetaMask` namespace collisions.
* **Contextual Guidance**: Clear user feedback for browser-native wallets (e.g. Brave Wallet built into the browser requiring localhost/HTTPS) without prompting unnecessary extension downloads.
* **Accessible Modal Dialog**: Portal-rendered with Tab focus containment, focus restoration on close, Escape key dismissal, backdrop click dismissal, and background scroll locking without horizontal layout shift.
* **Dual Status Badges**: Clear state separation between connection and authentication (`Wallet connected · Not signed in` vs `Status: Signed out`).

### Server-Verified Sign-In & Protected Access
* **Standard EIP-4361 (Sign-In with Ethereum)**: Generates and validates standard SIWE messages using `viem/siwe`.
* **Cryptographic Signer Recovery**: Verifies cryptographic ECDSA signatures using `viem` (`recoverAddress` / `hashMessage`) for Externally Owned Accounts (EOAs).
* **Single-Use Replay Protection**: Challenges have a 5-minute lifespan and are consumed atomically in storage to eliminate replay and race conditions.
* **Secure Cookie-Based Sessions**: Opaque 32-byte session tokens stored exclusively as SHA-256 hashes server-side and issued via `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` (production) cookies.
* **Protected Routes & Server Components**: Server-enforced `/dashboard` page and `/api/dashboard/data` endpoint validating sessions directly against storage.
* **Session Lifecycle Synchronization**: Valid sessions persist across page reloads; switching active accounts in the wallet immediately revokes the server session.

---

## Architecture & Security Model

```
Browser / Wallet                         Next.js Server                       Storage (Memory/Redis)
  │                                           │                                        │
  ├─── 1. POST /api/auth/challenge ──────────>│                                        │
  │    (address, chainId)                     ├──── Store challenge (5m TTL) ─────────>│
  │<── 2. Return challenge message & ID ──────┤    Set dg_challenge cookie             │
  │                                           │                                        │
  ├─── 3. Sign message via personal_sign ─────┤                                        │
  │    (No gas, off-chain signature)          │                                        │
  │                                           │                                        │
  ├─── 4. POST /api/auth/verify ─────────────>│                                        │
  │    (challengeId, message, signature)      ├──── Atomically consume challenge ─────>│
  │                                           ├──── Verify SIWE fields & signer        │
  │                                           ├──── Create session (24h TTL) ─────────>│
  │<── 5. Set dg_session cookie (HttpOnly) ───┤                                        │
  │                                           │                                        │
  ├─── 6. GET /dashboard or /api/dashboard ──>│                                        │
  │    (with dg_session cookie)               ├──── Validate session token hash ──────>│
  │<── 7. Render protected inner sanctum ─────┤                                        │
```

### Production Security Boundaries (Fail-Closed Policy)

Dragoon’s Gate enforces an explicit **fail-closed security policy** in production:
* Multi-instance and serverless production environments (such as Vercel) require shared storage for distributed session tracking and atomic challenge consumption.
* When `NODE_ENV=production` and `REDIS_URL` is omitted, the application immediately throws a `[Security Policy Violation]` error on startup and halts execution.
* The system will **never** silently fall back to process-local memory in production, preventing replay vulnerabilities across serverless execution instances.
* In development or local testing (`NODE_ENV != 'production'`), omitting `REDIS_URL` safely activates the process-local in-memory storage adapter.

---

## Environment Variables

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

| Variable | Required in Production | Default (Dev) | Purpose |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_ORIGIN` | **Yes** | `http://localhost:3000` | Canonical application URL used to validate SIWE URI and CORS origin. |
| `APP_DOMAIN` | **Yes** | `localhost:3000` | Canonical domain used to validate EIP-4361 message domain. |
| `REDIS_URL` | **Yes** | None *(Memory fallback)* | Connection string for shared Redis instance (e.g. Upstash Redis). |

---

## Quick Setup & Local Development

### Prerequisites
* **Node.js**: >= 18.18.0 or 20.x
* **npm**: >= 9.x
* An EVM browser wallet (e.g. Brave Wallet, MetaMask, Phantom, Coinbase Wallet)

### Installation & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run the automated integration test suite (11 test cases)
npm test

# 3. Run lint checks
npm run lint

# 4. Build for production
npm run build

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Test Methodology

### Automated Integration Tests (`npm test`)

The test harness runs both in-memory logic tests and live Redis integration tests:

#### 1. In-Memory Suite (`tests/auth.test.js` — 11 Tests Passed)
Exercises server verification logic using ephemeral cryptographic test keypairs (`viem/accounts`) and the process-local storage adapter:
1. **Successful Login**: Issues challenge, signs with ephemeral test private key, verifies SIWE message, issues session cookie, confirms storage record.
2. **Tampered Signatures**: Rejects signatures signed by mismatched keys or malformed signature bytes (HTTP 401).
3. **Mismatched Login Fields**: Rejects tampered domains, nonces, and chain IDs (HTTP 400).
4. **Expired Challenges**: Rejects challenges whose 5-minute lifespan has elapsed (HTTP 400).
5. **Replay Attack Defense**: Guarantees that a consumed challenge cannot be reused (HTTP 400).
6. **Concurrent Consumption Races**: Confirms atomic challenge consumption under concurrent requests—strictly one succeeds while concurrent attempts fail.
7. **Browser Challenge Binding**: Rejects verification when the browser cookie (`dg_challenge`) is missing or mismatched.
8. **Session Persistence & Revocation**: Confirms session retrieval, immediate revocation on sign-out, and rejection of revoked cookie reuse.
9. **Protected Resource Enclosure**: Rejects unauthenticated direct access to `/api/dashboard/data` and `/dashboard` (HTTP 401 / redirect).
10. **CSRF & Origin Verification**: Validates request origins against trusted configuration; blocks cross-origin state modification.
11. **Fail-Closed Policy**: Proves startup throws and halts if `NODE_ENV=production` without `REDIS_URL`.

#### 2. Live Redis Suite (`tests/redis.test.js` — 6 Tests Passed)
Verified against a live Redis instance exercising `RedisStorageAdapter` and atomic Lua scripts:
1. **Challenge Storage & TTL**: Challenge keys (`challenge:<id>`) are stored in real Redis with verified time-to-live (<= 300s) and serialized EIP-4361 parameters.
2. **Cryptographic Login & Session Lifespan**: Successfully parses SIWE signatures, atomically consumes the challenge from Redis, and stores the session (`session:<tokenHash>`) with 24-hour TTL.
3. **Concurrent Nonce Consumption**: 5 simultaneous verification attempts for the identical challenge execute against Redis via the custom `consumeChallengeAtomic` Lua script; exactly 1 succeeds and 4 fail closed (HTTP 400).
4. **Replay Attack Defense**: Consumed challenge cannot be reused from Redis.
5. **Session Revocation**: User sign-out immediately executes `DEL session:<tokenHash>` in Redis; subsequent cookie presentation returns `null` and rejects protected access.
6. **Production Policy Compliance**: Confirms `NODE_ENV=production` with valid `REDIS_URL` instantiates `RedisStorageAdapter` and passes health checks without fail-closed exceptions.

### Manual Browser & Real Wallet Verification
* **Discovery Protocol**: Verified multi-injected provider announcements via EIP-6963 across Brave Wallet, MetaMask, Phantom, and Coinbase Wallet.
* **Real Signature Flow**: Completed end-to-end `personal_sign` challenges in browser wallet extensions, verifying zero gas usage and zero on-chain transactions.
* **Responsive Interactions**: Tested layout, modal scroll locking, and touch targets across desktop and mobile screen viewports.

---

## Limitations

* **Externally Owned Accounts (EOA) Only**: Smart contract wallets relying on ERC-1271 off-chain signature validation (`isValidSignature`) are not currently supported in this version.
* **Supported Wallets**: Injected wallets adhering to EIP-6963 and standard EIP-1193 providers (MetaMask, Brave, Phantom, Coinbase Wallet). WalletConnect QR modal is not included in this build.
* **Production Storage Dependency**: Deployment requires a managed Redis instance (such as Upstash Redis or Redis Cloud) to satisfy the production fail-closed security policy.

---

## Vercel Deployment Settings

When deploying to Vercel:

1. **Framework Preset**: `Next.js`
2. **Root Directory**: `./`
3. **Build Command**: `next build` (or `npm run build`)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install`
6. **Node.js Version**: `20.x`
7. **Environment Variables**:
   * `NEXT_PUBLIC_APP_ORIGIN`: Your production Vercel URL (e.g. `https://dragoons-gate.vercel.app`)
   * `APP_DOMAIN`: Your production domain (e.g. `dragoons-gate.vercel.app`)
   * `REDIS_URL`: Your production Redis connection string (e.g. `rediss://default:token@your-upstash-redis.upstash.io:6379`)

---

Independent Portfolio Demo — by Qamra Ariva.
