import { NextResponse } from "next/server";
import { getSessionFromToken } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";

export async function GET(request) {
  const config = getAppConfig();
  const sessionCookie = request.cookies.get(config.sessionCookieName);
  const sessionToken = sessionCookie?.value;

  const session = await getSessionFromToken(sessionToken);

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      address: session.address,
      chainId: session.chainId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    }
  );
}
