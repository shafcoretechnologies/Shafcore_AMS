import { NextResponse } from "next/server";
import { buildClearedSessionCookie, revokeSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ensureSameOrigin } from "@/lib/auth/csrf";

export async function POST(request) {
  const csrfError = ensureSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  await revokeSessionByToken(token);

  const response = NextResponse.json({ message: "Logged out." });
  const cookie = buildClearedSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
