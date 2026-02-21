"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

export default function ProfileWorkspace({ user }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to change password.");
        setIsLoading(false);
        return;
      }

      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 900);
    } catch {
      setError("Unexpected error while changing password.");
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.workspace}>
      <article className={styles.infoCard}>
        <h2>Account details</h2>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
      </article>

      <article className={styles.formCard}>
        <h2>Change password</h2>
        <p className={styles.hint}>
          Use at least 12 characters with uppercase, lowercase, number, and special character.
        </p>
        <form onSubmit={onSubmit} className={styles.form}>
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />

          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.success}>{message}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </article>
    </section>
  );
}
