import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

const WRITE_ROLES = ["SUPER_ADMIN", "IT_MANAGER"];
const VALID_ROLES = new Set(Object.values(UserRole));

export async function PATCH(request, { params }) {
  const csrfError = ensureSameOrigin(request);
  if (csrfError) {
    return csrfError;
  }

  const auth = await requireRole(request, WRITE_ROLES);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const userId = params.userId;
    const name = body.name?.trim();
    const role = body.role?.trim();
    const password = body.password;

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    if (!name && !role && !password) {
      return NextResponse.json({ error: "At least one field is required for update." }, { status: 400 });
    }

    if (role && !VALID_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (password && password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    }

    const data = {};
    if (name) {
      data.name = name;
    }
    if (role) {
      data.role = role;
    }
    if (password) {
      data.passwordHash = await hashPassword(password);
      data.passwordUpdatedAt = new Date();
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordUpdatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update user.", detail: error.message }, { status: 500 });
  }
}
