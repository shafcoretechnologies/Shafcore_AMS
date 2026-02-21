import styles from "./page.module.css";
import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const session = await getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <div className={styles.heroLogo}>
              <Image src="/shafcore-logo.png" alt="Shafcore" width={128} height={105} priority />
            </div>
            <p className={styles.kicker}>Shafcore AMS</p>
            <h1>Track every asset, every bay, every branch.</h1>
            <p className={styles.subtitle}>
              Built for IT operations: central inventory, employee tagging, firmware and warranty visibility, and
              approval-controlled onboarding.
            </p>
            <div className={styles.quickActions}>
              <Link href="/assets" className={styles.primaryAction}>
                Open Asset Details
              </Link>
              <Link href="/assets" className={styles.secondaryAction}>
                Add New Asset
              </Link>
              <Link href="/master-data" className={styles.secondaryAction}>
                Manage Master Data
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          <Link href="/master-data" className={styles.cardLink}>
            <article className={styles.card}>
              <h2>Master Data</h2>
              <p>Manage branches, locations, bays, employees, and core structure.</p>
            </article>
          </Link>

          <Link href="/assets" className={styles.cardLink}>
            <article className={styles.card}>
              <h2>Assets</h2>
              <p>Add assets quickly and assign them to location, bay, or employee.</p>
            </article>
          </Link>

          <Link href="/approvals" className={styles.cardLink}>
            <article className={styles.card}>
              <h2>Approvals</h2>
              <p>Review asset onboarding requests and process manager approvals.</p>
            </article>
          </Link>
        </section>

        <section className={styles.footerPanel}>
          <div>
            <h3>Welcome, {session.user.name}</h3>
            <p>
              Role: <strong>{session.user.role}</strong>
            </p>
          </div>
          <div className={styles.tagRow}>
            <span>Master Data</span>
            <span>Assets</span>
            <span>Approvals</span>
          </div>
        </section>
      </main>
    </div>
  );
}
