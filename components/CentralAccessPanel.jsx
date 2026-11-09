"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useEIP6963Wallets,
  shortenAddress,
  formatChainName,
} from "@/hooks/useEIP6963Wallets";
import { useAuth } from "@/hooks/useAuth";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import {
  CopyIcon,
  CheckIcon,
  DisconnectIcon,
  KeyIcon,
  SpinnerIcon,
  VerifiedSessionIcon,
} from "@/components/WalletIcons";

export function CentralAccessPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const {
    walletOptions,
    connectedWallet,
    connectingId,
    error: walletError,
    clearError: clearWalletError,
    connect,
    disconnect,
  } = useEIP6963Wallets();

  const {
    isAuthenticated,
    authenticatedAddress,
    isSigningIn,
    authError,
    clearAuthError,
    signIn,
    signOut,
    invalidateInFlightLogin,
  } = useAuth(connectedWallet, disconnect);

  const handleOpenModal = () => {
    clearWalletError();
    clearAuthError();
    setIsModalOpen(true);
  };

  const handleSelectWallet = async (wallet) => {
    const success = await connect(wallet);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDisconnect = async () => {
    invalidateInFlightLogin();
    if (isAuthenticated) {
      await signOut();
    }
    disconnect();
  };

  const handleCopyAddress = async (addrToCopy) => {
    if (!addrToCopy) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(addrToCopy);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      }
    } catch {
      // Ignore copy error
    }
  };

  const IconComponent = connectedWallet?.IconComponent;

  return (
    <>
      <section
        aria-labelledby="access-panel-heading"
        className="relative rounded-2xl bg-[#0d1017]/90 border border-indigo-500/20 shadow-[0_0_50px_-15px_rgba(99,102,241,0.15)] backdrop-blur-xl p-6 sm:p-8 flex flex-col gap-6"
      >
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <h2
              id="access-panel-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5"
            >
              <span>Enter Dragoon’s Gate</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Sign in securely with your Ethereum wallet.
            </p>
          </div>

          {/* Dynamic Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <div
                role="status"
                aria-label="Authentication Status: Server-verified session"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 shadow-inner"
              >
                <span
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                  aria-hidden="true"
                />
                <span>Server-verified session</span>
              </div>
            ) : connectedWallet ? (
              <>
                <div
                  role="status"
                  aria-label="Wallet Status: Wallet connected · Not signed in"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>Wallet connected · Not signed in</span>
                </div>
                <div
                  role="status"
                  aria-label="Authentication Status: Signed out"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-700/60"
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-500" aria-hidden="true" />
                  <span>
                    Status: <strong className="text-zinc-100 font-semibold">Signed out</strong>
                  </span>
                </div>
              </>
            ) : (
              <div
                role="status"
                aria-label="Authentication Status: Signed out"
                className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 shadow-inner"
              >
                <span className="w-2 h-2 rounded-full bg-zinc-500" aria-hidden="true" />
                <span>
                  Status: <strong className="text-zinc-100 font-semibold">Signed out</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Panel Body: 3 Concise States */}
        {isAuthenticated ? (
          /* ================================================================
             STATE 3: AUTHENTICATED
             ================================================================ */
          <div className="flex flex-col gap-5">
            <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <VerifiedSessionIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-400">
                    Verified Account
                  </span>
                  <p
                    className="font-mono text-sm font-semibold text-zinc-100"
                    title={authenticatedAddress}
                  >
                    {shortenAddress(authenticatedAddress)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCopyAddress(authenticatedAddress)}
                  aria-label="Copy verified address"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                >
                  {copyFeedback ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Enter Dashboard
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 transition-colors"
                >
                  <DisconnectIcon className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : connectedWallet ? (
          /* ================================================================
             STATE 2: CONNECTED BUT UNAUTHENTICATED
             ================================================================ */
          <div className="flex flex-col gap-5">
            {/* Wallet Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    Connected Provider
                  </span>
                  <div className="flex items-center gap-2">
                    {connectedWallet.iconUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={connectedWallet.iconUri}
                        alt=""
                        className="w-5 h-5 object-contain"
                        aria-hidden="true"
                      />
                    ) : IconComponent ? (
                      <IconComponent className="w-5 h-5" />
                    ) : null}
                    <span className="text-xs font-semibold text-zinc-200">
                      {connectedWallet.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t border-zinc-800/60">
                  <span className="text-xs font-medium text-zinc-400">
                    Account Address
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-sm font-semibold text-zinc-100"
                      title={connectedWallet.address}
                    >
                      {shortenAddress(connectedWallet.address)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(connectedWallet.address)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      {copyFeedback ? (
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#090b11] border border-zinc-800/90 p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    Active Network
                  </span>
                  <span className="text-xs font-medium text-indigo-300">
                    {formatChainName(connectedWallet.chainId)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <span className="text-xs text-zinc-400">Provider Control</span>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 transition-colors"
                  >
                    <DisconnectIcon className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div
                role="alert"
                className="rounded-xl bg-red-950/40 border border-red-500/40 p-3.5 text-xs text-red-200 leading-relaxed flex items-start gap-2.5"
              >
                <div className="flex-1">
                  <p className="font-semibold text-red-100">Sign-In Notice</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Action Row: Sign In Button & Caption */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <button
                type="button"
                onClick={signIn}
                disabled={isSigningIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 disabled:opacity-60 transition-all duration-200 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {isSigningIn ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-4 h-4 text-white" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-400 text-center sm:text-left">
                Sign a login message. No transaction or gas fee.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================
             STATE 1: DISCONNECTED
             ================================================================ */
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">
              Connect your wallet to begin.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleOpenModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 transition-all duration-200 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
                <span>Connect Wallet</span>
              </button>

              <span className="text-xs text-zinc-400">
                Supports Brave, MetaMask, Phantom, and Coinbase Wallet
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Accessible Portal Dialog */}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        walletOptions={walletOptions}
        connectingId={connectingId}
        error={walletError}
        onSelectWallet={handleSelectWallet}
      />
    </>
  );
}
