import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function GET(request) {
  const auth = await requireRole(request, ["SUPER_ADMIN", "IT_MANAGER", "IT_ADMIN", "AUDITOR"]);
  if (!auth.ok) {
    return auth.response;
  }

  const status = new URL(request.url).searchParams.get("status");

  const approvals = await prisma.assetApproval.findMany({
    where: status ? { status } : undefined,
    orderBy: { requestedAt: "desc" },
    include: {
      asset: {
        include: {
          assetType: true,
          branch: true,
          location: true,
          bay: true,
          currentEmployee: true,
        },
      },
      requestedBy: true,
      reviewedBy: true,
    },
  });

  return NextResponse.json({ data: approvals });
}
