import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request) {
  const { authenticated, session } = await authenticateRequest(request);

  if (!authenticated || !session) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired session." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  }

  return NextResponse.json(
    {
      address: session.address,
      chainId: session.chainId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      demoData: {
        realm: "Dragoon’s Gate Inner Sanctum",
        accessTier: "Server-Verified Citizen",
        sessionSecurity: "EIP-4361 SIWE + HttpOnly Hash-Bound Cookie",
        statement:
          "Cryptographic proof of ownership verified without passwords or gas fees.",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    }
  );
}
