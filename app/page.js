import { CentralAccessPanel } from "@/components/CentralAccessPanel";
import {
  GateLogo,
  KeyIcon,
  WalletIcon,
  SignatureIcon,
  VerifiedSessionIcon,
  GasFreeIcon,
} from "@/components/WalletIcons";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#07080d] text-zinc-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background radial gradient: deep indigo transitioning smoothly into black */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[520px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/25 via-indigo-950/15 to-transparent blur-3xl opacity-75" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(7,8,13,0.85)_60%,#07080d_100%)]" />
      </div>

      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* 1. Compact Header */}
      <header className="relative z-10 w-full border-b border-zinc-800/80 bg-[#07080d]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GateLogo className="w-8 h-8 shrink-0 text-indigo-400" />
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-lg tracking-tight text-zinc-100">
                Dragoon’s Gate
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                Wallet Sign-In
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                aria-hidden="true"
              />
              Portfolio Demo
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-10"
      >
        {/* 2. Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="text-center max-w-2xl mx-auto flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-800">
            <KeyIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Wallet Sign-In</span>
          </div>

          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.15]"
          >
            <span>
              Your Wallet.{" "}
            </span>
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              Your Identity.
            </span>
          </h1>

          <div className="max-w-md mx-auto flex flex-col items-center gap-1.5 text-center">
            <p className="text-base sm:text-lg font-medium text-zinc-200 leading-snug">
              Sign in with your wallet.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              No passwords. Just a signed message to enter.
            </p>
            <p className="text-xs sm:text-sm font-medium text-indigo-400/90 tracking-wide mt-1">
              No transaction · No gas fee
            </p>
          </div>
        </section>

        {/* 3. Central Access Panel */}
        <CentralAccessPanel />

        {/* 4. Compact “How sign-in works” explanation */}
        <section
          aria-labelledby="how-it-works-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3
              id="how-it-works-heading"
              className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight"
            >
              How sign-in works
            </h3>
            <span className="text-xs text-zinc-500">3-Step Protocol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-xl bg-[#0d1017]/60 border border-zinc-800/80 p-4 sm:p-5 flex flex-col gap-3 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400">
                  01
                </span>
                <WalletIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Connect your wallet
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Link an EVM provider (e.g., Brave, MetaMask, Phantom, Coinbase)
                  to expose your public address to the client.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl bg-[#0d1017]/60 border border-zinc-800/80 p-4 sm:p-5 flex flex-col gap-3 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400">
                  02
                </span>
                <SignatureIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Review and sign a login message
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Sign a structured challenge with a server-issued nonce to prove
                  private key ownership.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl bg-[#0d1017]/60 border border-zinc-800/80 p-4 sm:p-5 flex flex-col gap-3 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400">
                  03
                </span>
                <VerifiedSessionIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Access your authenticated session
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  The server validates your cryptographic signature against the
                  nonce to grant entry.
                </p>
              </div>
            </div>
          </div>

          {/* Gas & Transaction Note */}
          <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/70 p-3.5 sm:p-4 flex items-center gap-3 text-xs sm:text-sm text-zinc-400">
            <GasFreeIcon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              The intended login uses a message signature, not a transaction, and
              requires no network gas.
            </span>
          </div>
        </section>
      </main>

      {/* 5. Footer with exact required signature and 12-13px regular styling */}
      <footer className="relative z-10 w-full border-t border-zinc-800/80 bg-[#07080d]/90 py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[12px] font-normal text-zinc-400">
            Independent Portfolio Demo — by Qamra Ariva.
          </p>
          <p className="text-[11px] text-zinc-500">
            Wallet Sign-In · No Password Needed
          </p>
        </div>
      </footer>
    </div>
  );
}
