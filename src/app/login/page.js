import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import LoginForm from "./ui/login-form";
import styles from "./ui/login.module.css";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getSessionFromCookieStore();
  if (session) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <main className={styles.panel}>
        <div className={styles.logoWrap}>
          <Image src="/shafcore-logo.png" alt="Shafcore" width={88} height={72} priority />
        </div>
        <p className={styles.kicker}>Shafcore AMS</p>
        <h1>Secure sign in</h1>
        <p className={styles.subtitle}>Use your approved company account to continue.</p>
        <LoginForm />
      </main>
    </div>
  );
}
