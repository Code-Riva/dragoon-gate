"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BraveWalletIcon,
  MetaMaskIcon,
  PhantomIcon,
  CoinbaseIcon,
} from "@/components/WalletIcons";

// Defined in the exact required order:
// Brave Wallet → MetaMask → Phantom → Coinbase Wallet
export const TARGET_WALLETS = [
  {
    id: "brave",
    name: "Brave Wallet",
    rdns: ["com.brave.wallet"],
    IconComponent: BraveWalletIcon,
    isBrave: true,
  },
  {
    id: "metamask",
    name: "MetaMask",
    rdns: ["io.metamask", "io.metamask.mobile"],
    IconComponent: MetaMaskIcon,
  },
  {
    id: "phantom",
    name: "Phantom",
    rdns: ["app.phantom"],
    IconComponent: PhantomIcon,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    rdns: ["com.coinbase.wallet"],
    IconComponent: CoinbaseIcon,
  },
];

export function shortenAddress(address) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatChainName(chainId) {
  if (!chainId) return "Unknown Chain";
  const normalized =
    typeof chainId === "string"
      ? chainId.toLowerCase()
      : `0x${chainId.toString(16)}`;
  switch (normalized) {
    case "0x1":
    case "0x01":
      return "Ethereum Mainnet";
    case "0xaa36a7":
      return "Sepolia Testnet";
    case "0x89":
      return "Polygon";
    case "0xa4b1":
      return "Arbitrum One";
    case "0xa":
    case "0x0a":
      return "OP Mainnet";
    case "0x2105":
      return "Base";
    default: {
      const decimal = parseInt(normalized, 16);
      return !isNaN(decimal) ? `Chain ID: ${decimal}` : `Chain: ${chainId}`;
    }
  }
}

export function useEIP6963Wallets() {
  const [discoveredProviders, setDiscoveredProviders] = useState([]);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [error, setError] = useState(null);

  // Active provider and listener refs to ensure clean teardown
  const activeProviderRef = useRef(null);
  const listenersRef = useRef({
    accountsChanged: null,
    chainChanged: null,
    disconnect: null,
  });

  // 1. EIP-6963 Multi-Injected Provider Discovery
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnnounce = (event) => {
      if (!event?.detail?.info || !event?.detail?.provider) return;
      const { info, provider } = event.detail;

      setDiscoveredProviders((prev) => {
        const exists = prev.some(
          (p) => p.info.rdns === info.rdns || p.info.uuid === info.uuid
        );
        if (exists) return prev;
        return [...prev, { info, provider }];
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    // Request announcement from any already-loaded providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    };
  }, []);

  // 2. Resolve provider for each target wallet (EIP-6963 preferred, strict non-colliding fallback)
  const resolveTargetWallet = useCallback(
    (target) => {
      // 2a. EIP-6963 check by RDNS
      const matched = discoveredProviders.find((p) =>
        target.rdns.includes(p.info.rdns)
      );
      if (matched) {
        return {
          ...target,
          isAvailable: true,
          provider: matched.provider,
          iconUri: matched.info.icon || null,
          displayName: matched.info.name || target.name,
        };
      }

      // 2b. Strict, isolated legacy fallbacks if EIP-6963 is not yet announced
      if (typeof window !== "undefined") {
        if (target.id === "brave") {
          // Brave injects window.braveEthereum or window.ethereum with isBraveWallet
          const braveProvider =
            window.braveEthereum ||
            (window.ethereum?.isBraveWallet ? window.ethereum : null);
          if (braveProvider) {
            return {
              ...target,
              isAvailable: true,
              provider: braveProvider,
              iconUri: null,
              displayName: target.name,
            };
          }
        } else if (target.id === "phantom") {
          // Phantom injects window.phantom.ethereum
          const phantomProvider =
            window.phantom?.ethereum ||
            (window.ethereum?.isPhantom ? window.ethereum : null);
          if (phantomProvider) {
            return {
              ...target,
              isAvailable: true,
              provider: phantomProvider,
              iconUri: null,
              displayName: target.name,
            };
          }
        } else if (target.id === "coinbase") {
          // Coinbase Wallet injects window.coinbaseWalletExtension
          const coinbaseProvider =
            window.coinbaseWalletExtension ||
            (window.ethereum?.isCoinbaseWallet ? window.ethereum : null);
          if (coinbaseProvider) {
            return {
              ...target,
              isAvailable: true,
              provider: coinbaseProvider,
              iconUri: null,
              displayName: target.name,
            };
          }
        } else if (target.id === "metamask") {
          // Isolated MetaMask check: ensure it's not Brave or Phantom masquerading
          let mmProvider = null;
          if (Array.isArray(window.ethereum?.providers)) {
            mmProvider = window.ethereum.providers.find(
              (p) =>
                p.isMetaMask &&
                !p.isBraveWallet &&
                !p.isPhantom &&
                !p.isCoinbaseWallet
            );
          } else if (
            window.ethereum?.isMetaMask &&
            !window.ethereum?.isBraveWallet &&
            !window.ethereum?.isPhantom &&
            !window.ethereum?.isCoinbaseWallet
          ) {
            mmProvider = window.ethereum;
          }

          if (mmProvider) {
            return {
              ...target,
              isAvailable: true,
              provider: mmProvider,
              iconUri: null,
              displayName: target.name,
            };
          }
        }
      }

      // Unavailable
      return {
        ...target,
        isAvailable: false,
        provider: null,
        iconUri: null,
        displayName: target.name,
      };
    },
    [discoveredProviders]
  );

  const walletOptions = TARGET_WALLETS.map(resolveTargetWallet);

  // 3. Detach listeners cleanly
  const removeProviderListeners = useCallback(() => {
    const provider = activeProviderRef.current;
    if (!provider || typeof provider.removeListener !== "function") return;

    if (listenersRef.current.accountsChanged) {
      provider.removeListener(
        "accountsChanged",
        listenersRef.current.accountsChanged
      );
    }
    if (listenersRef.current.chainChanged) {
      provider.removeListener("chainChanged", listenersRef.current.chainChanged);
    }
    if (listenersRef.current.disconnect) {
      provider.removeListener("disconnect", listenersRef.current.disconnect);
    }

    listenersRef.current = {
      accountsChanged: null,
      chainChanged: null,
      disconnect: null,
    };
    activeProviderRef.current = null;
  }, []);

  // 4. Disconnect action
  const disconnect = useCallback(() => {
    removeProviderListeners();
    setConnectedWallet(null);
    setError(null);
  }, [removeProviderListeners]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      removeProviderListeners();
    };
  }, [removeProviderListeners]);

  // 5. Connect to chosen provider
  const connect = useCallback(
    async (target) => {
      const resolved = resolveTargetWallet(target);
      if (!resolved.isAvailable || !resolved.provider) {
        if (target.isBrave) {
          setError(
            "Brave Wallet is built into the Brave browser and may require HTTPS or localhost. If you are using Brave, verify the wallet is enabled in Settings. No extension download is required."
          );
        } else {
          setError(
            `${target.name} is not detected. Please install or enable the browser extension.`
          );
        }
        return false;
      }

      setConnectingId(target.id);
      setError(null);

      const provider = resolved.provider;

      try {
        // Request accounts via EIP-1193
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts authorized by wallet.");
        }

        let chainId = null;
        try {
          chainId = await provider.request({ method: "eth_chainId" });
        } catch {
          // Chain ID fetch failure is non-fatal for connection
        }

        // Clean up any previously attached provider listeners first
        removeProviderListeners();

        // Setup event handlers
        const handleAccountsChanged = (newAccounts) => {
          if (!newAccounts || newAccounts.length === 0) {
            disconnect();
          } else {
            setConnectedWallet((prev) =>
              prev ? { ...prev, address: newAccounts[0] } : null
            );
          }
        };

        const handleChainChanged = (newChainId) => {
          setConnectedWallet((prev) =>
            prev ? { ...prev, chainId: newChainId } : null
          );
        };

        const handleDisconnect = () => {
          disconnect();
        };

        if (typeof provider.on === "function") {
          provider.on("accountsChanged", handleAccountsChanged);
          provider.on("chainChanged", handleChainChanged);
          provider.on("disconnect", handleDisconnect);

          listenersRef.current = {
            accountsChanged: handleAccountsChanged,
            chainChanged: handleChainChanged,
            disconnect: handleDisconnect,
          };
          activeProviderRef.current = provider;
        }

        setConnectedWallet({
          id: target.id,
          name: resolved.displayName,
          address: accounts[0],
          chainId: chainId,
          provider: provider,
          iconUri: resolved.iconUri,
          IconComponent: target.IconComponent,
        });

        return true;
      } catch (err) {
        // Distinguish specific error categories per web3-wallet-transactions skill
        if (err?.code === 4001 || err?.message?.toLowerCase().includes("rejected")) {
          setError("Connection request was cancelled in your wallet.");
        } else if (err?.code === -32002) {
          setError(
            "A connection request is already pending in your wallet. Please open your wallet extension to respond."
          );
        } else {
          setError(
            err?.message || "Failed to connect to the selected wallet."
          );
        }
        return false;
      } finally {
        setConnectingId(null);
      }
    },
    [resolveTargetWallet, removeProviderListeners, disconnect]
  );

  return {
    walletOptions,
    connectedWallet,
    connectingId,
    error,
    clearError: () => setError(null),
    connect,
    disconnect,
  };
}
