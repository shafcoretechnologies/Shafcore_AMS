import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import ApprovalWorkspace from "./ui/approval-workspace";
import styles from "./ui/approvals.module.css";

export default async function ApprovalsPage() {
  const session = await getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }

  const approvals = await prisma.assetApproval.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      asset: {
        include: {
          assetType: true,
          branch: true,
          location: true,
          bay: true,
        },
      },
      requestedBy: true,
      reviewedBy: true,
    },
  });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Approval Queue</p>
          <h1>Review and authorize asset onboarding</h1>
          <p>IT Manager approves or rejects new asset requests submitted by IT Admin.</p>
        </header>
        <ApprovalWorkspace role={session.user.role} initialApprovals={approvals} />
      </main>
    </div>
  );
}
