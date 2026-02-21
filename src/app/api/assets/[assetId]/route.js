import { NextResponse } from "next/server";
import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ensureSameOrigin } from "@/lib/auth/csrf";

function toPositiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export async function PATCH(request, { params }) {
  try {
    const csrfError = ensureSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    const auth = await requireRole(request, ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"]);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const assetId = params.assetId;
    const {
      assetTag,
      assetTypeId,
      branchId,
      assetModelId,
      modelCreateManufacturer,
      modelCreateName,
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
      linkedChildAssetIds,
      serviceTag,
      selectedRamModuleIds,
      selectedStorageDeviceIds,
      ramCreateMake,
      ramCreateModel,
      ramCreateVendor,
      ramCreatePurchaseDate,
      ramCreateWarrantyMonths,
      ramCreateSizeGb,
      ramCreateType,
      ramCreateSerialNumber,
      storageCreateMake,
      storageCreateModel,
      storageCreateVendor,
      storageCreatePurchaseDate,
      storageCreateWarrantyMonths,
      storageCreateSizeGb,
      storageCreateType,
      storageCreateSerialNumber,
      osVersion,
      make,
      model,
      processorDetails,
      adapterTagNumber,
      ramSlotDetails,
      storageDevices,
      warrantyValue,
      warrantyUnit,
      floor,
      bayCode,
      invoiceDate,
      invoiceAmount,
      invoiceFileUrl,
      repairOrReplacement,
      replaceAssetId,
    } = body;

    const cleanTag = assetTag?.trim();
    if (!assetId || !cleanTag || !assetTypeId || !branchId) {
      return NextResponse.json(
        { error: "assetId, assetTag, assetTypeId, and branchId are required." },
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

    let resolvedAssetModelId = assetModelId || null;
    if (!resolvedAssetModelId && modelCreateManufacturer?.trim() && modelCreateName?.trim()) {
      const createdModel = await prisma.assetModel.upsert({
        where: {
          assetTypeId_manufacturer_modelName: {
            assetTypeId,
            manufacturer: modelCreateManufacturer.trim(),
            modelName: modelCreateName.trim(),
          },
        },
        update: {},
        create: {
          assetTypeId,
          manufacturer: modelCreateManufacturer.trim(),
          modelName: modelCreateName.trim(),
        },
      });
      resolvedAssetModelId = createdModel.id;
    }

    const cleanPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const cleanInvoiceDate = invoiceDate ? new Date(invoiceDate) : null;
    const cleanInvoiceAmount = toPositiveNumber(invoiceAmount);
    const cleanWarrantyValue = Number(warrantyValue);
    const hasWarrantyValue = Number.isFinite(cleanWarrantyValue) && cleanWarrantyValue > 0;
    const cleanWarrantyUnit = warrantyUnit === "YEARS" ? "YEARS" : "MONTHS";
    const warrantyMonths = hasWarrantyValue
      ? cleanWarrantyUnit === "YEARS"
        ? cleanWarrantyValue * 12
        : cleanWarrantyValue
      : null;

    let resolvedWarrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;
    if (!resolvedWarrantyExpiry && cleanPurchaseDate && hasWarrantyValue) {
      const derived = new Date(cleanPurchaseDate);
      derived.setMonth(derived.getMonth() + warrantyMonths);
      resolvedWarrantyExpiry = derived;
    }

    const normalizedSpecification = {
      ...(specification && typeof specification === "object" ? specification : {}),
      serviceTag: serviceTag || null,
      osVersion: osVersion || null,
      make: make || null,
      model: model || null,
      processorDetails: processorDetails || null,
      adapterTagNumber: adapterTagNumber || null,
      ramSlotDetails: ramSlotDetails || null,
      storageDevices: storageDevices || null,
      invoiceDate: cleanInvoiceDate ? cleanInvoiceDate.toISOString() : null,
      invoiceAmount: cleanInvoiceAmount,
      invoiceFileUrl: invoiceFileUrl || null,
      warrantyValue: hasWarrantyValue ? cleanWarrantyValue : null,
      warrantyUnit: hasWarrantyValue ? cleanWarrantyUnit : null,
      floor: floor || null,
      bayCode: bayCode || null,
      repairOrReplacement:
        repairOrReplacement === "REPAIR" || repairOrReplacement === "REPLACEMENT"
          ? repairOrReplacement
          : null,
      replacementForAssetId: replaceAssetId || null,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const ramIds = Array.isArray(selectedRamModuleIds)
        ? selectedRamModuleIds.map((value) => String(value).trim()).filter(Boolean)
        : [];
      const storageIds = Array.isArray(selectedStorageDeviceIds)
        ? selectedStorageDeviceIds.map((value) => String(value).trim()).filter(Boolean)
        : [];

      if (ramCreateMake && ramCreateModel && ramCreateVendor && ramCreatePurchaseDate && ramCreateWarrantyMonths && ramCreateSizeGb && ramCreateType && ramCreateSerialNumber) {
        const purchase = new Date(ramCreatePurchaseDate);
        const months = Number(ramCreateWarrantyMonths);
        const expiry = new Date(purchase);
        expiry.setMonth(expiry.getMonth() + months);
        const createdRam = await tx.ramModule.upsert({
          where: { serialNumber: String(ramCreateSerialNumber).trim() },
          update: {},
          create: {
            make: String(ramCreateMake).trim(),
            model: String(ramCreateModel).trim(),
            vendor: String(ramCreateVendor).trim(),
            purchaseDate: purchase,
            warrantyMonths: months,
            warrantyExpiry: expiry,
            sizeGb: Number(ramCreateSizeGb),
            type: String(ramCreateType).trim(),
            serialNumber: String(ramCreateSerialNumber).trim(),
          },
        });
        ramIds.push(createdRam.id);
      }

      if (
        storageCreateMake &&
        storageCreateModel &&
        storageCreateVendor &&
        storageCreatePurchaseDate &&
        storageCreateWarrantyMonths &&
        storageCreateSizeGb &&
        storageCreateType &&
        storageCreateSerialNumber
      ) {
        const purchase = new Date(storageCreatePurchaseDate);
        const months = Number(storageCreateWarrantyMonths);
        const expiry = new Date(purchase);
        expiry.setMonth(expiry.getMonth() + months);
        const createdStorage = await tx.storageDevice.upsert({
          where: { serialNumber: String(storageCreateSerialNumber).trim() },
          update: {},
          create: {
            make: String(storageCreateMake).trim(),
            model: String(storageCreateModel).trim(),
            vendor: String(storageCreateVendor).trim(),
            purchaseDate: purchase,
            warrantyMonths: months,
            warrantyExpiry: expiry,
            sizeGb: Number(storageCreateSizeGb),
            type: String(storageCreateType).trim(),
            serialNumber: String(storageCreateSerialNumber).trim(),
          },
        });
        storageIds.push(createdStorage.id);
      }

      const asset = await tx.asset.update({
        where: { id: assetId },
        data: {
          assetTag: cleanTag,
          assetTypeId,
          assetModelId: resolvedAssetModelId,
          branchId,
          locationId,
          bayId,
          currentEmployeeId,
          serialNumber,
          warrantyExpiry: resolvedWarrantyExpiry,
          warrantyMonths,
          firmwareVersion,
          purchaseDate: cleanPurchaseDate,
          vendorName,
          invoiceNumber,
          invoiceDate: cleanInvoiceDate,
          invoiceAmount: cleanInvoiceAmount,
          invoiceFileUrl: invoiceFileUrl || null,
          serviceTag: serviceTag || null,
          osVersion: osVersion || null,
          processorDetails: processorDetails || null,
          make: make || null,
          model: model || null,
          adapterTagNumber: adapterTagNumber || null,
          floor: floor || null,
          repairAction: normalizedSpecification.repairOrReplacement,
          replacementForAssetId: replaceAssetId || null,
          specification: normalizedSpecification,
          notes,
          parentAssetId,
          status: currentEmployeeId ? AssetStatus.ASSIGNED : AssetStatus.IN_STOCK,
        },
        include: {
          assetType: true,
          assetModel: true,
          branch: true,
          location: true,
          bay: true,
          currentEmployee: true,
          ramModules: { include: { ramModule: true } },
          storageDevices: { include: { storageDevice: true } },
        },
      });

      const childIds = Array.isArray(linkedChildAssetIds)
        ? linkedChildAssetIds.map((value) => String(value).trim()).filter(Boolean)
        : [];
      if (childIds.length) {
        await tx.asset.updateMany({
          where: {
            id: { in: childIds },
          },
          data: {
            parentAssetId: asset.id,
          },
        });
      }

      await tx.assetRamModule.deleteMany({ where: { assetId: asset.id } });
      if (ramIds.length) {
        await tx.assetRamModule.createMany({
          data: Array.from(new Set(ramIds)).map((ramModuleId) => ({
            assetId: asset.id,
            ramModuleId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.assetStorageDevice.deleteMany({ where: { assetId: asset.id } });
      if (storageIds.length) {
        await tx.assetStorageDevice.createMany({
          data: Array.from(new Set(storageIds)).map((storageDeviceId) => ({
            assetId: asset.id,
            storageDeviceId,
          })),
          skipDuplicates: true,
        });
      }

      if (replaceAssetId && replaceAssetId !== asset.id && normalizedSpecification.repairOrReplacement) {
        const prior = await tx.asset.findUnique({
          where: { id: replaceAssetId },
          select: { specification: true, notes: true },
        });
        if (prior) {
          const priorSpec =
            prior.specification && typeof prior.specification === "object"
              ? prior.specification
              : {};
          const priorNote = normalizedSpecification.repairOrReplacement === "REPAIR"
            ? `Moved to repair by replacement asset ${asset.assetTag}`
            : `Replaced by asset ${asset.assetTag}`;
          await tx.asset.update({
            where: { id: replaceAssetId },
            data: {
              status:
                normalizedSpecification.repairOrReplacement === "REPAIR"
                  ? AssetStatus.IN_REPAIR
                  : AssetStatus.RETIRED,
              specification: {
                ...priorSpec,
                replacedByAssetId: asset.id,
                replacementAction: normalizedSpecification.repairOrReplacement,
              },
              notes: prior.notes ? `${prior.notes}\n${priorNote}` : priorNote,
            },
          });
        }
      }

      return asset;
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update asset.", detail: error.message }, { status: 500 });
  }
}
