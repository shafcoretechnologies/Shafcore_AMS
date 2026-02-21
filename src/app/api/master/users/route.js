import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

const READ_ROLES = ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"];
const WRITE_ROLES = ["SUPER_ADMIN", "IT_MANAGER"];
const VALID_ROLES = new Set(Object.values(UserRole));

export async function GET(request) {
  const auth = await requireRole(request, READ_ROLES);
  if (!auth.ok) {
    return auth.response;
  }

  const data = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordUpdatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data });
}

export async function POST(request) {
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
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const role = body.role?.trim();
    const password = body.password;

    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "name, email, role, and password are required." }, { status: 400 });
    }

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordUpdatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create user.", detail: error.message }, { status: 500 });
  }
}
