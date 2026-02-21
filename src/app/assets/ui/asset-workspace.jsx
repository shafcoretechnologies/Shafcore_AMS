"use client";

import { useMemo, useState } from "react";
import styles from "./assets.module.css";

const WRITE_ROLES = new Set(["SUPER_ADMIN", "IT_ADMIN"]);

async function apiFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data || payload;
}

export default function AssetWorkspace({ role, initialData }) {
  const [assets, setAssets] = useState(initialData.assets || []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canWrite = WRITE_ROLES.has(role);

  const filteredModels = useMemo(() => initialData.assetModels || [], [initialData.assetModels]);

  async function refreshAssets() {
    const data = await apiFetch("/api/assets");
    setAssets(data);
  }

  async function submitAsset(event) {
    event.preventDefault();
    if (!canWrite) {
      setError("Your role cannot add assets.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const form = new FormData(event.currentTarget);
      const payload = {
        assetTag: form.get("assetTag"),
        assetTypeId: form.get("assetTypeId"),
        assetModelId: form.get("assetModelId") || null,
        branchId: form.get("branchId"),
        locationId: form.get("locationId") || null,
        bayId: form.get("bayId") || null,
        currentEmployeeId: form.get("currentEmployeeId") || null,
        serialNumber: form.get("serialNumber") || null,
        firmwareVersion: form.get("firmwareVersion") || null,
        warrantyExpiry: form.get("warrantyExpiry") || null,
        purchaseDate: form.get("purchaseDate") || null,
        vendorName: form.get("vendorName") || null,
        invoiceNumber: form.get("invoiceNumber") || null,
        notes: form.get("notes") || null,
      };

      await apiFetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setMessage("Asset submitted for approval.");
      event.currentTarget.reset();
      await refreshAssets();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.statusRow}>
        <span className={styles.roleTag}>Role: {role}</span>
        {message ? <span className={styles.success}>{message}</span> : null}
        {error ? <span className={styles.error}>{error}</span> : null}
      </div>

      <article className={styles.formCard}>
        <h2>Create Asset</h2>
        <form className={styles.form} onSubmit={submitAsset}>
          <input name="assetTag" placeholder="Asset Tag (required)" required />
          <select name="assetTypeId" required>
            <option value="">Select Asset Type</option>
            {initialData.assetTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select name="assetModelId">
            <option value="">Select Model (optional)</option>
            {filteredModels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.assetType.name} / {item.manufacturer} {item.modelName}
              </option>
            ))}
          </select>
          <select name="branchId" required>
            <option value="">Select Branch</option>
            {initialData.branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
          <select name="locationId">
            <option value="">Select Location (optional)</option>
            {initialData.locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.branch.code} / {item.name}
              </option>
            ))}
          </select>
          <select name="bayId">
            <option value="">Select Bay (optional)</option>
            {initialData.bays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.location.branch.code}/{item.location.name} / Bay {item.code}
              </option>
            ))}
          </select>
          <select name="currentEmployeeId">
            <option value="">Assign to Employee (optional)</option>
            {initialData.employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.branch.code} / {item.employeeCode} - {item.name}
              </option>
            ))}
          </select>
          <input name="serialNumber" placeholder="Serial Number (optional)" />
          <input name="firmwareVersion" placeholder="Firmware Version (optional)" />
          <input name="vendorName" placeholder="Vendor (optional)" />
          <input name="invoiceNumber" placeholder="Invoice Number (optional)" />
          <label htmlFor="purchaseDate">Purchase Date</label>
          <input id="purchaseDate" name="purchaseDate" type="date" />
          <label htmlFor="warrantyExpiry">Warranty Expiry</label>
          <input id="warrantyExpiry" name="warrantyExpiry" type="date" />
          <textarea name="notes" placeholder="Notes (optional)" rows={3} />
          <button disabled={!canWrite} type="submit">
            Submit for Approval
          </button>
        </form>
      </article>

      <article className={styles.tableCard}>
        <h3>Recent Assets ({assets.length})</h3>
        <ul>
          {assets.map((asset) => (
            <li key={asset.id}>
              <span>{asset.assetTag}</span>
              <span>{asset.assetType.name}</span>
              <span>{asset.branch.code}</span>
              <span>{asset.approvalStatus}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
