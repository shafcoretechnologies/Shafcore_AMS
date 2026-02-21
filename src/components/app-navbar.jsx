"use client";

import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/logout-button";
import styles from "./app-shell.module.css";

export default function AppNavbar({ user }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.brandRow}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/shafcore-logo.png"
            alt="Shafcore"
            width={44}
            height={36}
            priority
            className={styles.logoImage}
          />
        </Link>
        <span className={styles.subBrand}>Shafcore AMS</span>
      </div>

      <nav className={styles.navActions}>
        <Link href="/" className={styles.ghostBtn}>
          Dashboard
        </Link>
        {user ? (
          <>
            <div className={styles.logoutWrap}>
              <LogoutButton />
            </div>
          </>
        ) : (
          <Link href="/login" className={styles.ghostBtn}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
