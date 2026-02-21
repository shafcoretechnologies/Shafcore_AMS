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

  const locationId = new URL(request.url).searchParams.get("locationId");

  const data = await prisma.bay.findMany({
    where: locationId ? { locationId } : undefined,
    orderBy: [{ location: { branch: { name: "asc" } } }, { location: { name: "asc" } }, { code: "asc" }],
    include: {
      location: { include: { branch: true } },
      _count: { select: { assets: true } },
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
    const locationId = body.locationId?.trim();
    const code = body.code?.trim();
    const description = body.description?.trim();

    if (!locationId || !code) {
      return NextResponse.json({ error: "locationId and code are required." }, { status: 400 });
    }

    const created = await prisma.bay.create({
      data: {
        locationId,
        code,
        description: description || null,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create bay.", detail: error.message }, { status: 500 });
  }
}
