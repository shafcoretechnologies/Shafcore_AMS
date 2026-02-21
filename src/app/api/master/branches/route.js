import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

const READ_ROLES = ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER", "AUDITOR"];
const WRITE_ROLES = ["SUPER_ADMIN", "IT_ADMIN"];

export async function GET(request) {
  const auth = await requireRole(request, READ_ROLES);
  if (!auth.ok) {
    return auth.response;
  }

  const data = await prisma.branch.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          locations: true,
          employees: true,
          assets: true,
        },
      },
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
    const code = body.code?.trim().toUpperCase();
    const name = body.name?.trim();

    if (!code || !name) {
      return NextResponse.json({ error: "code and name are required." }, { status: 400 });
    }

    const created = await prisma.branch.create({
      data: { code, name },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create branch.", detail: error.message }, { status: 500 });
  }
}
