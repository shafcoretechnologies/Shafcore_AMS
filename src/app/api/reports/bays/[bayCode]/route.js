import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function GET(request, { params }) {
  const auth = await requireRole(request, ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER", "AUDITOR"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { bayCode } = await params;
  const branchCode = new URL(request.url).searchParams.get("branchCode");

  const bay = await prisma.bay.findFirst({
    where: {
      code: bayCode,
      ...(branchCode ? { location: { branch: { code: branchCode } } } : {}),
    },
    include: {
      location: { include: { branch: true } },
      assets: {
        orderBy: { assetTag: "asc" },
        include: {
          assetType: true,
          assetModel: true,
          currentEmployee: true,
          childAssets: {
            include: {
              assetType: true,
              assetModel: true,
            },
          },
        },
      },
    },
  });

  if (!bay) {
    return NextResponse.json({ error: "Bay not found." }, { status: 404 });
  }

  return NextResponse.json({
    bay: {
      code: bay.code,
      description: bay.description,
      location: bay.location.name,
      floor: bay.location.floor,
      branch: bay.location.branch.name,
      branchCode: bay.location.branch.code,
    },
    assets: bay.assets.map((asset) => ({
      assetTag: asset.assetTag,
      type: asset.assetType.name,
      model: asset.assetModel ? `${asset.assetModel.manufacturer} ${asset.assetModel.modelName}` : null,
      serialNumber: asset.serialNumber,
      firmwareVersion: asset.firmwareVersion,
      warrantyExpiry: asset.warrantyExpiry,
      assignedTo: asset.currentEmployee ? asset.currentEmployee.name : null,
      bundleItems: asset.childAssets.map((child) => ({
        assetTag: child.assetTag,
        type: child.assetType.name,
        serialNumber: child.serialNumber,
      })),
    })),
  });
}
