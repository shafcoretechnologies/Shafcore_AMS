import { NextResponse } from "next/server";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function getTokenFromRequest(request) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  const session = await validateSessionToken(token);

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true, session, user: session.user };
}

export async function requireRole(request, allowedRoles) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return auth;
}
