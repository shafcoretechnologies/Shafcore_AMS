import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AssetWorkspace from "./ui/asset-workspace";
import styles from "./ui/assets.module.css";

export default async function AssetsPage() {
  const session = await getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }

  const hasRamModuleDelegate = typeof prisma.ramModule?.findMany === "function";
  const hasStorageDeviceDelegate = typeof prisma.storageDevice?.findMany === "function";

  const assetInclude = {
    assetType: true,
    branch: true,
    location: true,
    bay: true,
    currentEmployee: true,
    ...(hasRamModuleDelegate ? { ramModules: { include: { ramModule: true } } } : {}),
    ...(hasStorageDeviceDelegate ? { storageDevices: { include: { storageDevice: true } } } : {}),
  };

  const [branches, locations, bays, employees, assetTypes, assetModels, ramModules, storageDevices, rawAssets] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: [{ branch: { name: "asc" } }, { name: "asc" }], include: { branch: true } }),
    prisma.bay.findMany({
      orderBy: [{ location: { branch: { name: "asc" } } }, { location: { name: "asc" } }, { code: "asc" }],
      include: { location: { include: { branch: true } } },
    }),
    prisma.employee.findMany({ orderBy: [{ branch: { name: "asc" } }, { name: "asc" }], include: { branch: true } }),
    prisma.assetType.findMany({ orderBy: { name: "asc" } }),
    prisma.assetModel.findMany({
      orderBy: [{ assetType: { name: "asc" } }, { manufacturer: "asc" }, { modelName: "asc" }],
      include: { assetType: true },
    }),
    hasRamModuleDelegate
      ? prisma.ramModule.findMany({ orderBy: [{ make: "asc" }, { model: "asc" }, { sizeGb: "asc" }] })
      : Promise.resolve([]),
    hasStorageDeviceDelegate
      ? prisma.storageDevice.findMany({ orderBy: [{ make: "asc" }, { model: "asc" }, { sizeGb: "asc" }] })
      : Promise.resolve([]),
    prisma.asset.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: assetInclude,
    }),
  ]);

  const assets = rawAssets.map((asset) => ({
    ...asset,
    ramModules: asset.ramModules ?? [],
    storageDevices: asset.storageDevices ?? [],
  }));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Asset Intake</p>
          <h1>Add and track IT assets</h1>
          <p>Submit assets with hardware specs and map components (HDD/adapter) to parent devices. New assets go to manager approval automatically.</p>
        </header>
        <AssetWorkspace
          role={session.user.role}
          initialData={{
            branches,
            locations,
            bays,
            employees,
            assetTypes,
            assetModels,
            ramModules,
            storageDevices,
            assets,
          }}
        />
      </main>
    </div>
  );
}
