import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import MasterDataWorkspace from "./ui/master-data-workspace";
import styles from "./ui/master-data.module.css";
import { prisma } from "@/lib/prisma";

export default async function MasterDataPage() {
  const session = await getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }
  const canReadUsers = ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"].includes(session.user.role);

  const [branches, locations, bays, employees, users] = await Promise.all([
    prisma.branch.findMany({
      orderBy: [{ name: "asc" }],
      include: { _count: { select: { locations: true, employees: true, assets: true } } },
    }),
    prisma.location.findMany({
      orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
      include: { branch: true, _count: { select: { bays: true, assets: true } } },
    }),
    prisma.bay.findMany({
      orderBy: [{ location: { branch: { name: "asc" } } }, { location: { name: "asc" } }, { code: "asc" }],
      include: { location: { include: { branch: true } }, _count: { select: { assets: true } } },
    }),
    prisma.employee.findMany({
      orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
      include: { branch: true, _count: { select: { currentAssets: true } } },
    }),
    canReadUsers
      ? prisma.user.findMany({
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordUpdatedAt: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Master Data</p>
          <h1>Branches, locations, bays, and employees</h1>
          <p>Central management for asset assignment and reporting structure.</p>
        </header>
        <MasterDataWorkspace
          role={session.user.role}
          initialData={{ branches, locations, bays, employees, users }}
        />
      </main>
    </div>
  );
}
