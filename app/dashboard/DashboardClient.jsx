"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, CheckIcon, DisconnectIcon } from "@/components/WalletIcons";

export function DashboardClient({ address }) {
  const router = useRouter();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Copy Address */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy authenticated address"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {copyFeedback ? (
          <>
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Address Copied</span>
          </>
        ) : (
          <>
            <CopyIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Copy Address</span>
          </>
        )}
      </button>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoggingOut}
        aria-label="Sign out of authenticated session"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <DisconnectIcon className="w-3.5 h-3.5" />
        <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
      </button>
    </div>
  );
}
