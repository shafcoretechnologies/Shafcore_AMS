import { NextResponse } from "next/server";
import { ensureSameOrigin } from "@/lib/auth/csrf";
import { requireAuth } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buildClearedSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function validatePasswordPolicy(password) {
  if (password.length < 12) {
    return "Password must be at least 12 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}

export async function PATCH(request) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const auth = await requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "currentPassword and newPassword are required." }, { status: 400 });
    }

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Password record not found." }, { status: 400 });
    }

    const currentOk = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const sameAsOld = await verifyPassword(newPassword, user.passwordHash);
    if (sameAsOld) {
      return NextResponse.json({ error: "New password must be different from current password." }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.user.id },
        data: {
          passwordHash: newHash,
          passwordUpdatedAt: new Date(),
        },
      });
      await tx.userSession.updateMany({
        where: {
          userId: auth.user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });

    const response = NextResponse.json({
      message: "Password changed successfully. Please log in again.",
    });
    const clearedCookie = buildClearedSessionCookie();
    response.cookies.set(clearedCookie.name, clearedCookie.value, clearedCookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Unable to update password.", detail: error.message }, { status: 500 });
  }
}
