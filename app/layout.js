import "./globals.css";

export const metadata = {
  title: "Dragoon’s Gate — Wallet Sign-In",
  description:
    "Cryptographic Ethereum wallet sign-in foundation demo. Prove wallet ownership without passwords or gas fees.",
  keywords: ["Ethereum", "Wallet Sign-In", "Web3", "Authentication", "Portfolio Demo", "Dragoon's Gate"],
  authors: [{ name: "Qamra Ariva" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07080d] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
        {children}
      </body>
    </html>
  );
}
