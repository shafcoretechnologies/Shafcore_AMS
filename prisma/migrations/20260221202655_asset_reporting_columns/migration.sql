-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "adapterTagNumber" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "invoiceAmount" DECIMAL(12,2),
ADD COLUMN     "invoiceDate" TIMESTAMP(3),
ADD COLUMN     "invoiceFileUrl" TEXT,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "osVersion" TEXT,
ADD COLUMN     "processorDetails" TEXT,
ADD COLUMN     "repairAction" TEXT,
ADD COLUMN     "replacementForAssetId" TEXT,
ADD COLUMN     "serviceTag" TEXT,
ADD COLUMN     "warrantyMonths" INTEGER;

-- CreateIndex
CREATE INDEX "Asset_serviceTag_idx" ON "Asset"("serviceTag");

-- CreateIndex
CREATE INDEX "Asset_osVersion_idx" ON "Asset"("osVersion");

-- CreateIndex
CREATE INDEX "Asset_processorDetails_idx" ON "Asset"("processorDetails");

-- CreateIndex
CREATE INDEX "Asset_make_model_idx" ON "Asset"("make", "model");

-- CreateIndex
CREATE INDEX "Asset_replacementForAssetId_idx" ON "Asset"("replacementForAssetId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_replacementForAssetId_fkey" FOREIGN KEY ("replacementForAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill reporting columns from existing JSON specification payload
UPDATE "Asset"
SET
  "serviceTag" = COALESCE("serviceTag", NULLIF("specification"->>'serviceTag', '')),
  "osVersion" = COALESCE("osVersion", NULLIF("specification"->>'osVersion', '')),
  "processorDetails" = COALESCE("processorDetails", NULLIF("specification"->>'processorDetails', '')),
  "make" = COALESCE("make", NULLIF("specification"->>'make', '')),
  "model" = COALESCE("model", NULLIF("specification"->>'model', '')),
  "adapterTagNumber" = COALESCE("adapterTagNumber", NULLIF("specification"->>'adapterTagNumber', '')),
  "floor" = COALESCE("floor", NULLIF("specification"->>'floor', '')),
  "invoiceFileUrl" = COALESCE("invoiceFileUrl", NULLIF("specification"->>'invoiceFileUrl', '')),
  "repairAction" = COALESCE("repairAction", NULLIF("specification"->>'repairOrReplacement', '')),
  "replacementForAssetId" = COALESCE("replacementForAssetId", NULLIF("specification"->>'replacementForAssetId', '')),
  "invoiceDate" = COALESCE("invoiceDate", NULLIF("specification"->>'invoiceDate', '')::timestamp),
  "invoiceAmount" = COALESCE("invoiceAmount", NULLIF("specification"->>'invoiceAmount', '')::decimal(12,2)),
  "warrantyMonths" = COALESCE(
    "warrantyMonths",
    CASE
      WHEN NULLIF("specification"->>'warrantyValue', '') IS NULL THEN NULL
      WHEN COALESCE("specification"->>'warrantyUnit', 'MONTHS') = 'YEARS'
        THEN (NULLIF("specification"->>'warrantyValue', '')::int * 12)
      ELSE NULLIF("specification"->>'warrantyValue', '')::int
    END
  );
