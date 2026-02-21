import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

const WRITE_ROLES = ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"];

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
    const employeeId = params.employeeId;
    const branchId = body.branchId?.trim();
    const employeeCode = body.employeeCode?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const department = body.department?.trim();
    const designation = body.designation?.trim();

    if (!employeeId || !branchId || !employeeCode || !name) {
      return NextResponse.json(
        { error: "employeeId, branchId, employeeCode, and name are required." },
        { status: 400 },
      );
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        branchId,
        employeeCode,
        name,
        email: email || null,
        department: department || null,
        designation: designation || null,
      },
      include: {
        branch: true,
        _count: {
          select: {
            currentAssets: true,
          },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update employee.", detail: error.message }, { status: 500 });
  }
}
