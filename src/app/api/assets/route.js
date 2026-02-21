import { NextResponse } from "next/server";
import { ApprovalAction, ApprovalStatus, AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

export async function GET(request) {
  const auth = await requireRole(request, ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER", "AUDITOR"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const bayCode = searchParams.get("bayCode");
  const q = searchParams.get("q");

  const assets = await prisma.asset.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(q
        ? {
            OR: [
              { assetTag: { contains: q, mode: "insensitive" } },
              { serialNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(bayCode ? { bay: { code: bayCode } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assetType: true,
      assetModel: true,
      branch: true,
      location: true,
      bay: true,
      currentEmployee: true,
    },
  });

  return NextResponse.json({ data: assets });
}

export async function POST(request) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const auth = await requireRole(request, ["SUPER_ADMIN", "IT_ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const {
      assetTag,
      assetTypeId,
      branchId,
      assetModelId,
      locationId,
      bayId,
      currentEmployeeId,
      serialNumber,
      warrantyExpiry,
      firmwareVersion,
      purchaseDate,
      vendorName,
      invoiceNumber,
      specification,
      notes,
      parentAssetId,
    } = body;

    if (!assetTag || !assetTypeId || !branchId) {
      return NextResponse.json(
        { error: "assetTag, assetTypeId, and branchId are required." },
        { status: 400 },
      );
    }

    const assetType = await prisma.assetType.findUnique({ where: { id: assetTypeId } });
    if (!assetType) {
      return NextResponse.json({ error: "Invalid assetTypeId." }, { status: 400 });
    }

    if (assetType.requiresSerial && !serialNumber) {
      return NextResponse.json(
        { error: `Serial number is required for ${assetType.name}.` },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          assetTag,
          assetTypeId,
          assetModelId,
          branchId,
          locationId,
          bayId,
          currentEmployeeId,
          serialNumber,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
          firmwareVersion,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          vendorName,
          invoiceNumber,
          specification,
          notes,
          parentAssetId,
          status: currentEmployeeId ? AssetStatus.ASSIGNED : AssetStatus.IN_STOCK,
          approvalStatus: ApprovalStatus.PENDING,
          createdById: auth.user.id,
        },
      });

      const approval = await tx.assetApproval.create({
        data: {
          assetId: asset.id,
          action: ApprovalAction.CREATE,
          status: ApprovalStatus.PENDING,
          requestedById: auth.user.id,
          snapshot: body,
        },
      });

      return { asset, approval };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create asset.", detail: error.message }, { status: 500 });
  }
}
