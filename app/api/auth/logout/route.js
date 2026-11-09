import { NextResponse } from "next/server";
import { revokeSessionToken, validateRequestOrigin } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";

export async function POST(request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Invalid request origin." },
      { status: 403 }
    );
  }

  const config = getAppConfig();
  const sessionCookie = request.cookies.get(config.sessionCookieName);
  const sessionToken = sessionCookie?.value;

  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }

  const response = NextResponse.json(
    { success: true, message: "Session revoked successfully." },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    }
  );

  // Clear session cookie
  response.cookies.set({
    name: config.sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: 0,
  });

  return response;
}
