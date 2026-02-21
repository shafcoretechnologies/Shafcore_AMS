"use client";

import { useMemo, useState } from "react";
import styles from "./approvals.module.css";

const CAN_REVIEW = new Set(["SUPER_ADMIN", "IT_MANAGER"]);

async function apiFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data || payload;
}

export default function ApprovalWorkspace({ role, initialApprovals }) {
  const [approvals, setApprovals] = useState(initialApprovals || []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canReview = CAN_REVIEW.has(role);

  const pendingCount = useMemo(
    () => approvals.filter((item) => item.status === "PENDING").length,
    [approvals],
  );

  async function refreshApprovals() {
    const data = await apiFetch("/api/approvals");
    setApprovals(data);
  }

  async function review(approvalId, status) {
    if (!canReview) {
      setError("Your role cannot review approvals.");
      return;
    }

    try {
      setError("");
      setMessage("");
      await apiFetch(`/api/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setMessage(`Request ${status.toLowerCase()}.`);
      await refreshApprovals();
    } catch (reviewError) {
      setError(reviewError.message);
    }
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.statusRow}>
        <span className={styles.roleTag}>Role: {role}</span>
        <span className={styles.pendingTag}>Pending: {pendingCount}</span>
        {message ? <span className={styles.success}>{message}</span> : null}
        {error ? <span className={styles.error}>{error}</span> : null}
      </div>

      <article className={styles.tableCard}>
        <h2>Approval requests ({approvals.length})</h2>
        <ul>
          {approvals.map((item) => (
            <li key={item.id}>
              <div className={styles.meta}>
                <strong>{item.asset.assetTag}</strong>
                <span>{item.asset.assetType.name}</span>
                <span>{item.asset.branch.code}</span>
                <span>Status: {item.status}</span>
                <span>Requested by: {item.requestedBy.name}</span>
              </div>
              <div className={styles.actions}>
                <button
                  disabled={!canReview || item.status !== "PENDING"}
                  type="button"
                  onClick={() => review(item.id, "APPROVED")}
                >
                  Approve
                </button>
                <button
                  disabled={!canReview || item.status !== "PENDING"}
                  type="button"
                  className={styles.reject}
                  onClick={() => review(item.id, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
