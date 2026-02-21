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

  const branchId = new URL(request.url).searchParams.get("branchId");

  const data = await prisma.employee.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
    include: {
      branch: true,
      _count: {
        select: {
          currentAssets: true,
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
    const branchId = body.branchId?.trim();
    const employeeCode = body.employeeCode?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const department = body.department?.trim();
    const designation = body.designation?.trim();

    if (!branchId || !employeeCode || !name) {
      return NextResponse.json({ error: "branchId, employeeCode, and name are required." }, { status: 400 });
    }

    const created = await prisma.employee.create({
      data: {
        branchId,
        employeeCode,
        name,
        email: email || null,
        department: department || null,
        designation: designation || null,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create employee.", detail: error.message }, { status: 500 });
  }
}
