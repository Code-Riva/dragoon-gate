import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionFromToken } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";
import { formatChainName, shortenAddress } from "@/hooks/useEIP6963Wallets";
import { GateLogo, VerifiedSessionIcon } from "@/components/WalletIcons";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Dashboard — Dragoon’s Gate",
  description: "Server-verified authenticated dashboard.",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const config = getAppConfig();
  const sessionToken = cookieStore.get(config.sessionCookieName)?.value;

  const session = await getSessionFromToken(sessionToken);

  // Strictly enforce server-side authentication: redirect if unauthenticated or expired
  if (!session) {
    redirect("/?error=unauthorized");
  }

  const formattedSignInTime = new Date(session.createdAt).toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const formattedExpiryTime = new Date(session.expiresAt).toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  return (
    <div className="relative min-h-screen flex flex-col bg-[#07080d] text-zinc-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[520px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/25 via-indigo-950/15 to-transparent blur-3xl opacity-75" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(7,8,13,0.85)_60%,#07080d_100%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-zinc-800/80 bg-[#07080d]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <GateLogo className="w-8 h-8 shrink-0 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-lg tracking-tight text-zinc-100">
                Dragoon’s Gate
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                Verified Session
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
        {/* Dashboard Title & Server-Verified Session Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
              Authenticated Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Protected portal accessible exclusively through verified EIP-4361 sessions.
            </p>
          </div>

          <div
            role="status"
            aria-label="Session status: Server-verified session"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 shadow-inner"
          >
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden="true"
            />
            <span>Server-verified session</span>
          </div>
        </div>

        {/* Account Details & Session Card */}
        <section
          aria-labelledby="session-details-heading"
          className="rounded-2xl bg-[#0d1017]/90 border border-indigo-500/20 shadow-[0_0_50px_-15px_rgba(99,102,241,0.15)] backdrop-blur-xl p-6 sm:p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2
                id="session-details-heading"
                className="text-lg font-bold text-zinc-100 flex items-center gap-2"
              >
                <VerifiedSessionIcon className="w-5 h-5 text-indigo-400" />
                <span>Identity & Session Verification</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cryptographically bound to your Ethereum private key via server-validated nonce.
              </p>
            </div>

            <DashboardClient address={session.address} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Authenticated Wallet Address */}
            <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">
                Authenticated Wallet Address
              </span>
              <p
                className="font-mono text-sm font-semibold text-zinc-100 break-all select-all"
                title={session.address}
              >
                {session.address}
              </p>
              <span className="text-[11px] text-zinc-400">
                Display format: {shortenAddress(session.address)}
              </span>
            </div>

            {/* Network Chain ID */}
            <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">
                Authentication Chain
              </span>
              <p className="text-sm font-semibold text-zinc-100">
                {formatChainName(session.chainId)}
              </p>
              <span className="text-[11px] text-zinc-400">
                Verified at sign-in time
              </span>
            </div>

            {/* Sign-in Time */}
            <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">
                Sign-In Timestamp
              </span>
              <p className="text-sm font-semibold text-zinc-200">
                {formattedSignInTime}
              </p>
              <span className="text-[11px] text-zinc-400">
                ISO: {session.createdAt}
              </span>
            </div>

            {/* Session Expiry */}
            <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">
                Session Expiry
              </span>
              <p className="text-sm font-semibold text-zinc-200">
                {formattedExpiryTime}
              </p>
              <span className="text-[11px] text-zinc-400">
                Server-enforced automatic revocation
              </span>
            </div>
          </div>

          {/* Session-Bound Demo Data */}
          <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 sm:p-5 flex flex-col gap-2.5">
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
              Protected Demo Data
            </span>
            <div className="flex flex-col gap-1 text-xs sm:text-sm text-zinc-300">
              <p>
                <strong className="text-zinc-100">Domain:</strong> Dragoon’s Gate Inner Sanctum
              </p>
              <p>
                <strong className="text-zinc-100">Clearance:</strong> Server-Verified Citizen (EOA Ownership Verified)
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                This endpoint and view are secured by HttpOnly session tokens and server-validated cryptographic challenge consumption. Refreshing the browser preserves access until sign-out or session expiration.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with exact required signature and 12-13px regular styling */}
      <footer className="relative z-10 w-full border-t border-zinc-800/80 bg-[#07080d]/90 py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[12px] font-normal text-zinc-400">
            Independent Portfolio Demo — by Qamra Ariva.
          </p>
          <p className="text-[11px] text-zinc-500">
            EIP-4361 SIWE · Passwordless Web3 Authentication
          </p>
        </div>
      </footer>
    </div>
  );
}
