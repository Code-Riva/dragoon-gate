"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useAuth(connectedWallet) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAddress, setAuthenticatedAddress] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Tracks in-flight request ID to cancel late/stale responses
  const inFlightAttemptRef = useRef(0);
  const currentWalletRef = useRef(connectedWallet);

  useEffect(() => {
    currentWalletRef.current = connectedWallet;
  }, [connectedWallet]);

  // 1. Sign-Out Action (declared early so effects can depend on it)
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
      setAuthenticatedAddress(null);
      setSessionData(null);
      setAuthError(null);
      setIsSigningIn(false);
    }
  }, []);

  // 2. Initial Session Check (Survives page refresh without prompting wallet connection)
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          if (isMounted) setIsAuthenticated(false);
          return;
        }

        const data = await res.json();
        if (data?.authenticated && isMounted) {
          setIsAuthenticated(true);
          setAuthenticatedAddress(data.address);
          setSessionData(data);
        } else if (isMounted) {
          setIsAuthenticated(false);
          setAuthenticatedAddress(null);
          setSessionData(null);
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Invalidate In-Flight Sign-In if Account or Provider Changes
  const invalidateInFlightLogin = useCallback(() => {
    inFlightAttemptRef.current += 1;
    setIsSigningIn(false);
  }, []);

  // 4. Revoke authenticated session if account or chain changes during an active session
  useEffect(() => {
    if (!isAuthenticated || !authenticatedAddress) return;

    if (
      connectedWallet &&
      connectedWallet.address &&
      connectedWallet.address.toLowerCase() !== authenticatedAddress.toLowerCase()
    ) {
      // User switched to a different account in wallet: revoke previous session
      signOut();
    }
  }, [connectedWallet, isAuthenticated, authenticatedAddress, signOut]);

  // 5. Sign-In Action
  const signIn = useCallback(async () => {
    if (!connectedWallet || !connectedWallet.address || !connectedWallet.provider) {
      setAuthError("Please connect an Ethereum wallet before signing in.");
      return;
    }

    if (isSigningIn) return; // Prevent duplicate sign-in requests

    inFlightAttemptRef.current += 1;
    const attemptId = inFlightAttemptRef.current;

    setIsSigningIn(true);
    setAuthError(null);

    try {
      // Step A: Request unpredictable challenge from server
      const challengeRes = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: connectedWallet.address,
          chainId: connectedWallet.chainId || 1,
        }),
      });

      if (inFlightAttemptRef.current !== attemptId) return; // Aborted

      if (!challengeRes.ok) {
        const errorData = await challengeRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to obtain sign-in challenge.");
      }

      const challenge = await challengeRes.json();

      // Step B: Request message signature from selected wallet provider
      let signature;
      try {
        signature = await connectedWallet.provider.request({
          method: "personal_sign",
          params: [challenge.message, connectedWallet.address],
        });
      } catch (signErr) {
        if (inFlightAttemptRef.current !== attemptId) return;

        if (
          signErr?.code === 4001 ||
          signErr?.message?.toLowerCase().includes("reject") ||
          signErr?.message?.toLowerCase().includes("cancel")
        ) {
          throw new Error("Signature request was cancelled in your wallet.");
        }
        throw new Error(signErr?.message || "Wallet signature request failed.");
      }

      if (inFlightAttemptRef.current !== attemptId) return; // Aborted

      // Step C: Validate signature on server and create authenticated session
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          message: challenge.message,
          signature,
        }),
      });

      if (inFlightAttemptRef.current !== attemptId) return; // Aborted

      if (!verifyRes.ok) {
        const verifyError = await verifyRes.json().catch(() => ({}));
        throw new Error(
          verifyError.error || "Cryptographic signature validation failed."
        );
      }

      const verifiedData = await verifyRes.json();

      setIsAuthenticated(true);
      setAuthenticatedAddress(verifiedData.address);
      setSessionData(verifiedData);
      setAuthError(null);
    } catch (err) {
      if (inFlightAttemptRef.current === attemptId) {
        setAuthError(err.message || "Sign-in failed. Please try again.");
      }
    } finally {
      if (inFlightAttemptRef.current === attemptId) {
        setIsSigningIn(false);
      }
    }
  }, [connectedWallet, isSigningIn]);

  return {
    isAuthenticated,
    authenticatedAddress,
    sessionData,
    isSigningIn,
    authError,
    clearAuthError: () => setAuthError(null),
    isCheckingSession,
    signIn,
    signOut,
    invalidateInFlightLogin,
  };
}
