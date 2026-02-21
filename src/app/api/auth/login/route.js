import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buildSessionCookie, createSession } from "@/lib/auth/session";
import { clearRateLimit, getRateLimitKey, getRateLimitState, registerFailedAttempt } from "@/lib/auth/rate-limit";
import { ensureSameOrigin } from "@/lib/auth/csrf";

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const key = getRateLimitKey({ email, ipAddress: getClientIp(request) });
    const limitState = await getRateLimitState(key);
    if (limitState.blocked) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again later.", blockedUntil: limitState.blockedUntil },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      const failed = await registerFailedAttempt(key);
      return NextResponse.json(
        { error: "Invalid credentials.", remainingAttempts: failed.remainingAttempts },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const updated = await registerFailedAttempt(key);
      return NextResponse.json(
        { error: "Invalid credentials.", remainingAttempts: updated.remainingAttempts },
        { status: 401 },
      );
    }

    await clearRateLimit(key);
    const { token, expiresAt } = await createSession({ userId: user.id, headers: request.headers });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    const cookie = buildSessionCookie(token, expiresAt);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Login failed.", detail: error.message }, { status: 500 });
  }
}

// Convenience endpoint for creating first secure password if users exist without one.
export async function PATCH(request) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const newPassword = body.newPassword;
    const setupSecret = body.setupSecret;

    if (!process.env.AUTH_BOOTSTRAP_SECRET || setupSecret !== process.env.AUTH_BOOTSTRAP_SECRET) {
      return NextResponse.json({ error: "Invalid bootstrap secret." }, { status: 403 });
    }

    if (!email || !newPassword || newPassword.length < 12) {
      return NextResponse.json({ error: "Email and strong password (min 12 chars) are required." }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    const user = await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Password updated.",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    return NextResponse.json({ error: "Password setup failed.", detail: error.message }, { status: 500 });
  }
}
