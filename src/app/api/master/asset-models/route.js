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

  const assetTypeId = new URL(request.url).searchParams.get("assetTypeId");
  const data = await prisma.assetModel.findMany({
    where: assetTypeId ? { assetTypeId } : undefined,
    orderBy: [{ assetType: { name: "asc" } }, { manufacturer: "asc" }, { modelName: "asc" }],
    include: { assetType: true },
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
    const assetTypeId = body.assetTypeId?.trim();
    const manufacturer = body.manufacturer?.trim();
    const modelName = body.modelName?.trim();
    const defaultWarrantyMonths = body.defaultWarrantyMonths ? Number(body.defaultWarrantyMonths) : null;

    if (!assetTypeId || !manufacturer || !modelName) {
      return NextResponse.json(
        { error: "assetTypeId, manufacturer, and modelName are required." },
        { status: 400 },
      );
    }

    const created = await prisma.assetModel.create({
      data: {
        assetTypeId,
        manufacturer,
        modelName,
        defaultWarrantyMonths,
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create asset model.", detail: error.message }, { status: 500 });
  }
}
