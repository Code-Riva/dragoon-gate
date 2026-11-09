export function GateLogo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gatePrimary" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A5B4FC" />
          <stop offset="0.6" stopColor="#6366F1" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      {/* Outer Arch & Spire */}
      <path
        d="M6 28V14C6 8.477 10.477 4 16 4C21.523 4 26 8.477 26 14V28"
        stroke="url(#gatePrimary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Base Foundation Bar */}
      <path
        d="M4 28H28"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner Portal Arch */}
      <path
        d="M10 28V16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16V28"
        stroke="url(#gatePrimary)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Keystroke Spire */}
      <path
        d="M16 6.5V11M16 17V22"
        stroke="#818CF8"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Center Rune Diamond */}
      <polygon
        points="16,13 18.5,16 16,19 13.5,16"
        fill="#6366F1"
        stroke="#C7D2FE"
        strokeWidth="0.75"
      />
    </svg>
  );
}

export function BraveWalletIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 3L6 7V15C6 21.6 10.3 27.8 16 29C21.7 27.8 26 21.6 26 15V7L16 3Z"
        fill="#FB542B"
        fillOpacity="0.15"
        stroke="#FB542B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 8L10 13L12 21L16 24L20 21L22 13L16 8Z"
        fill="#FB542B"
      />
      <path
        d="M16 12V18M14 15H18"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MetaMaskIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M27.5 7.5L18.5 13.5L20.2 9.2L27.5 7.5Z"
        fill="#E2761B"
        stroke="#E2761B"
        strokeWidth="0.5"
      />
      <path
        d="M4.5 7.5L11.8 9.2L13.5 13.5L4.5 7.5Z"
        fill="#E2761B"
        stroke="#E2761B"
        strokeWidth="0.5"
      />
      <path
        d="M23.5 20.5L20.5 24.5L25.8 26L27 20.6L23.5 20.5Z"
        fill="#E2761B"
      />
      <path
        d="M5 20.6L6.2 26L11.5 24.5L8.5 20.5L5 20.6Z"
        fill="#E2761B"
      />
      <path
        d="M11.2 14.5L9.5 17.5L14.8 17.8L14.5 12L11.2 14.5Z"
        fill="#E4761B"
      />
      <path
        d="M20.8 14.5L17.5 12L17.2 17.8L22.5 17.5L20.8 14.5Z"
        fill="#E4761B"
      />
      <path
        d="M11.5 24.5L15 22.5L12 20.5L11.5 24.5Z"
        fill="#D7C1B3"
      />
      <path
        d="M20.5 24.5L20 20.5L17 22.5L20.5 24.5Z"
        fill="#D7C1B3"
      />
      <path
        d="M17 22.5L15 22.5L14.2 25.5L16 26.5L17.8 25.5L17 22.5Z"
        fill="#233447"
      />
    </svg>
  );
}

export function PhantomIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#AB9FF2" fillOpacity="0.15" />
      <path
        d="M24 16C24 11.58 20.42 8 16 8C11.58 8 8 11.58 8 16C8 19.5 10.25 22.47 13.42 23.53C13.8 23.66 14.2 23.41 14.2 23.01V20.5C14.2 20.22 14.42 20 14.7 20H17.3C17.58 20 17.8 20.22 17.8 20.5V23.01C17.8 23.41 18.2 23.66 18.58 23.53C21.75 22.47 24 19.5 24 16Z"
        fill="#AB9FF2"
      />
      <circle cx="13" cy="15" r="1.5" fill="#1C1B2A" />
      <circle cx="19" cy="15" r="1.5" fill="#1C1B2A" />
    </svg>
  );
}

export function CoinbaseIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" fill="#0052FF" />
      <rect x="11.5" y="11.5" width="9" height="9" rx="2" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="2.2" fill="#0052FF" />
    </svg>
  );
}

export function CopyIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function DisconnectIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" x2="12" y1="2" y2="12" />
    </svg>
  );
}

export function CloseIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SpinnerIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function KeyIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  );
}

export function WalletIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function SignatureIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      <path d="m14 2 7 7-9.5 9.5a2.5 2.5 0 0 1-1.5.7l-4.5.8.8-4.5a2.5 2.5 0 0 1 .7-1.5L14 2z" />
    </svg>
  );
}

export function VerifiedSessionIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function GasFreeIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 22h12" />
      <path d="M4 9h10" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  );
}

export function ShieldAlertIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export function InfoCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  );
}
