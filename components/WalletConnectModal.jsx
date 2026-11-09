"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, SpinnerIcon } from "@/components/WalletIcons";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function WalletConnectModal({
  isOpen,
  onClose,
  walletOptions,
  connectingId,
  error,
  onSelectWallet,
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  // Background scroll locking without horizontal page shift
  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Focus containment and restoration
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    // Shift initial focus to the first interactive element or close button
    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 20);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-dialog-title"
        aria-describedby="wallet-dialog-description"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1017] border border-indigo-500/30 p-6 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col gap-5 text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800/80">
          <div>
            <h2
              id="wallet-dialog-title"
              className="text-lg font-bold text-zinc-100 tracking-tight"
            >
              Connect a Wallet
            </h2>
            <p
              id="wallet-dialog-description"
              className="text-xs text-zinc-400 mt-0.5"
            >
              Select an injected EVM provider to attach your public Ethereum address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-950/40 border border-red-500/40 p-3.5 text-xs text-red-200 leading-relaxed flex items-start gap-2.5"
          >
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-100">Connection Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Wallet Picker List: Order: Brave Wallet → MetaMask → Phantom → Coinbase Wallet */}
        <div className="flex flex-col gap-2.5">
          {walletOptions.map((wallet) => {
            const isConnectingThis = connectingId === wallet.id;
            const isAnyConnecting = connectingId !== null;
            const IconComponent = wallet.IconComponent;

            return (
              <div
                key={wallet.id}
                className="flex flex-col gap-1.5"
              >
                <button
                  type="button"
                  disabled={!wallet.isAvailable || isAnyConnecting}
                  onClick={() => onSelectWallet(wallet)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    wallet.isAvailable
                      ? "bg-[#10141f] border-zinc-800 hover:border-indigo-500/50 hover:bg-[#151a29] cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "bg-[#090b11] border-zinc-800/50 opacity-60 cursor-not-allowed"
                  } ${isConnectingThis ? "border-indigo-500 bg-[#151a29]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden">
                      {wallet.iconUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={wallet.iconUri}
                          alt=""
                          className="w-6 h-6 object-contain"
                          aria-hidden="true"
                        />
                      ) : (
                        <IconComponent className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {wallet.displayName}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {wallet.isAvailable
                          ? "EIP-6963 detected · Ready"
                          : "Not detected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnectingThis ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        <SpinnerIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Connecting...
                      </span>
                    ) : wallet.isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                        Available
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-500 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800">
                        Unavailable
                      </span>
                    )}
                  </div>
                </button>

                {/* Specific context for Brave if unavailable */}
                {wallet.isBrave && !wallet.isAvailable && (
                  <p className="text-[11px] text-zinc-400 px-2 leading-relaxed">
                    Brave Wallet is built into the Brave browser and may require HTTPS or localhost. If you are using Brave, verify the wallet is enabled in Settings. No extension download is required.
                  </p>
                )}

                {/* Generic unavailable note for other wallets */}
                {!wallet.isBrave && !wallet.isAvailable && (
                  <p className="text-[11px] text-zinc-500 px-2 leading-relaxed">
                    Extension not detected in this browser.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
          EIP-6963 discovery connects directly to the exact selected provider without silent fallback or credential substitution.
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
