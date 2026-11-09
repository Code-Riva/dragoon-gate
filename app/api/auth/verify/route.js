import { NextResponse } from "next/server";
import { verifyLogin, validateRequestOrigin } from "@/lib/auth";
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

  const { challengeId, message, signature } = body || {};
  const config = getAppConfig();
  const challengeCookie = request.cookies.get(config.challengeCookieName);
  const browserChallengeId = challengeCookie?.value;

  const result = await verifyLogin({
    challengeId,
    message,
    signature,
    browserChallengeId,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      {
        status: result.status || 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      address: result.address,
      chainId: result.chainId,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    }
  );

  // Set authenticated opaque session token in HttpOnly cookie
  response.cookies.set({
    name: config.sessionCookieName,
    value: result.sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });

  // Clear challenge cookie
  response.cookies.set({
    name: config.challengeCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
}
