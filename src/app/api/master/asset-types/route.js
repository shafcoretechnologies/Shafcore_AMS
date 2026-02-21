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

  const data = await prisma.assetType.findMany({
    orderBy: { name: "asc" },
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
    const requiresSerial = Boolean(body.requiresSerial);

    if (!name) {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }

    const created = await prisma.assetType.create({
      data: { name, requiresSerial },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create asset type.", detail: error.message }, { status: 500 });
  }
}
