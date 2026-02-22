-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "asset";

-- CreateEnum
CREATE TYPE "asset"."UserRole" AS ENUM ('SUPER_ADMIN', 'IT_ADMIN', 'IT_MANAGER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "asset"."AssetStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'IN_USE', 'IN_REPAIR', 'RETIRED', 'DISPOSED', 'LOST');

-- CreateEnum
CREATE TYPE "asset"."ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "asset"."ApprovalAction" AS ENUM ('CREATE', 'UPDATE', 'RETIRE', 'DISPOSE');

-- CreateEnum
CREATE TYPE "asset"."AssignmentType" AS ENUM ('EMPLOYEE', 'LOCATION', 'BAY');

-- CreateTable
CREATE TABLE "asset"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "asset"."UserRole" NOT NULL,
    "passwordHash" TEXT,
    "passwordUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."UserSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."LoginRateLimit" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "asset"."Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."Location" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "roomCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."Bay" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."Employee" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."AssetType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."AssetModel" (
    "id" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "specs" JSONB,
    "defaultWarrantyMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "assetModelId" TEXT,
    "branchId" TEXT NOT NULL,
    "locationId" TEXT,
    "bayId" TEXT,
    "currentEmployeeId" TEXT,
    "status" "asset"."AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "serialNumber" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "warrantyMonths" INTEGER,
    "firmwareVersion" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "vendorName" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "invoiceAmount" DECIMAL(12,2),
    "invoiceFileUrl" TEXT,
    "serviceTag" TEXT,
    "osVersion" TEXT,
    "processorDetails" TEXT,
    "make" TEXT,
    "model" TEXT,
    "adapterTagNumber" TEXT,
    "floor" TEXT,
    "repairAction" TEXT,
    "replacementForAssetId" TEXT,
    "specification" JSONB,
    "notes" TEXT,
    "approvalStatus" "asset"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "parentAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignmentType" "asset"."AssignmentType" NOT NULL,
    "branchId" TEXT,
    "locationId" TEXT,
    "bayId" TEXT,
    "employeeId" TEXT,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."AssetApproval" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "action" "asset"."ApprovalAction" NOT NULL,
    "status" "asset"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reason" TEXT,
    "snapshot" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AssetApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."FirmwareHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FirmwareHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset"."AssetAuditLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "asset"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "asset"."UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "asset"."UserSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_revokedAt_idx" ON "asset"."UserSession"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "asset"."Branch"("code");

-- CreateIndex
CREATE INDEX "Location_branchId_name_idx" ON "asset"."Location"("branchId", "name");

-- CreateIndex
CREATE INDEX "Bay_code_idx" ON "asset"."Bay"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Bay_locationId_code_key" ON "asset"."Bay"("locationId", "code");

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "asset"."Employee"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_branchId_employeeCode_key" ON "asset"."Employee"("branchId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_name_key" ON "asset"."AssetType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetModel_assetTypeId_manufacturer_modelName_key" ON "asset"."AssetModel"("assetTypeId", "manufacturer", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "asset"."Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_branchId_locationId_bayId_idx" ON "asset"."Asset"("branchId", "locationId", "bayId");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_assignedAt_idx" ON "asset"."AssetAssignment"("assetId", "assignedAt");

-- AddForeignKey
ALTER TABLE "asset"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "asset"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Location" ADD CONSTRAINT "Location_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "asset"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Bay" ADD CONSTRAINT "Bay_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "asset"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "asset"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetModel" ADD CONSTRAINT "AssetModel_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset"."AssetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset"."AssetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_assetModelId_fkey" FOREIGN KEY ("assetModelId") REFERENCES "asset"."AssetModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "asset"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "asset"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "asset"."Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "asset"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "asset"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "asset"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "asset"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."Asset" ADD CONSTRAINT "Asset_replacementForAssetId_fkey" FOREIGN KEY ("replacementForAssetId") REFERENCES "asset"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "asset"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "asset"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "asset"."Bay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "asset"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "asset"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetApproval" ADD CONSTRAINT "AssetApproval_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetApproval" ADD CONSTRAINT "AssetApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "asset"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetApproval" ADD CONSTRAINT "AssetApproval_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "asset"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."FirmwareHistory" ADD CONSTRAINT "FirmwareHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."FirmwareHistory" ADD CONSTRAINT "FirmwareHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "asset"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAuditLog" ADD CONSTRAINT "AssetAuditLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset"."AssetAuditLog" ADD CONSTRAINT "AssetAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "asset"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
