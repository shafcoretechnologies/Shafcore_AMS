-- CreateTable
CREATE TABLE "RamModule" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyMonths" INTEGER NOT NULL,
    "warrantyExpiry" TIMESTAMP(3) NOT NULL,
    "sizeGb" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageDevice" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyMonths" INTEGER NOT NULL,
    "warrantyExpiry" TIMESTAMP(3) NOT NULL,
    "sizeGb" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRamModule" (
    "assetId" TEXT NOT NULL,
    "ramModuleId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetRamModule_pkey" PRIMARY KEY ("assetId","ramModuleId")
);

-- CreateTable
CREATE TABLE "AssetStorageDevice" (
    "assetId" TEXT NOT NULL,
    "storageDeviceId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetStorageDevice_pkey" PRIMARY KEY ("assetId","storageDeviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RamModule_serialNumber_key" ON "RamModule"("serialNumber");

-- CreateIndex
CREATE INDEX "RamModule_make_model_idx" ON "RamModule"("make", "model");

-- CreateIndex
CREATE UNIQUE INDEX "StorageDevice_serialNumber_key" ON "StorageDevice"("serialNumber");

-- CreateIndex
CREATE INDEX "StorageDevice_make_model_idx" ON "StorageDevice"("make", "model");

-- CreateIndex
CREATE INDEX "AssetRamModule_ramModuleId_idx" ON "AssetRamModule"("ramModuleId");

-- CreateIndex
CREATE INDEX "AssetStorageDevice_storageDeviceId_idx" ON "AssetStorageDevice"("storageDeviceId");

-- AddForeignKey
ALTER TABLE "AssetRamModule" ADD CONSTRAINT "AssetRamModule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetRamModule" ADD CONSTRAINT "AssetRamModule_ramModuleId_fkey" FOREIGN KEY ("ramModuleId") REFERENCES "RamModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStorageDevice" ADD CONSTRAINT "AssetStorageDevice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStorageDevice" ADD CONSTRAINT "AssetStorageDevice_storageDeviceId_fkey" FOREIGN KEY ("storageDeviceId") REFERENCES "StorageDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
