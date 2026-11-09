import { NextResponse } from "next/server";
import { createChallenge, validateRequestOrigin } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";

export async function POST(request) {
  // Validate request origin
  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Invalid request origin." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const { address, chainId } = body || {};
  if (!address) {
    return NextResponse.json(
      { error: "Ethereum address is required to issue a challenge." },
      { status: 400 }
    );
  }

  try {
    const config = getAppConfig();
    const challenge = await createChallenge({ address, chainId });

    const response = NextResponse.json(
      {
        challengeId: challenge.challengeId,
        message: challenge.message,
        expiresAt: challenge.expiresAt,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );

    // Bind challenge to browser via short-lived HttpOnly cookie
    response.cookies.set({
      name: config.challengeCookieName,
      value: challenge.challengeId,
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProduction,
      path: "/api/auth",
      maxAge: config.challengeTtlSeconds,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to generate login challenge." },
      { status: 400 }
    );
  }
}
