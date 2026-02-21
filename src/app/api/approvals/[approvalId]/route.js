import { NextResponse } from "next/server";
import { ApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

export async function PATCH(request, { params }) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const auth = await requireRole(request, ["SUPER_ADMIN", "IT_MANAGER"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { approvalId } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || ![ApprovalStatus.APPROVED, ApprovalStatus.REJECTED].includes(status)) {
      return NextResponse.json(
        { error: "status (APPROVED|REJECTED) is required." },
        { status: 400 },
      );
    }

    const approval = await prisma.assetApproval.findUnique({
      where: { id: approvalId },
      include: { asset: true },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedApproval = await tx.assetApproval.update({
        where: { id: approvalId },
        data: {
          status,
          reviewedById: auth.user.id,
          reviewedAt: new Date(),
          reason: reason || null,
        },
      });

      const updatedAsset = await tx.asset.update({
        where: { id: approval.assetId },
        data: {
          approvalStatus: status,
          approvedById: status === ApprovalStatus.APPROVED ? auth.user.id : null,
        },
      });

      return { approval: updatedApproval, asset: updatedAsset };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to process approval request.", detail: error.message },
      { status: 500 },
    );
  }
}
