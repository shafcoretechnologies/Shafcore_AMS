import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import ProfileWorkspace from "./ui/profile-workspace";
import styles from "./ui/profile.module.css";

export default async function ProfilePage() {
  const session = await getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Profile</p>
          <h1>Account security</h1>
          <p>Manage your sign-in password and keep your account protected.</p>
        </header>
        <ProfileWorkspace
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      </main>
    </div>
  );
}
