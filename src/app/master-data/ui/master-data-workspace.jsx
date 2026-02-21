"use client";

import { useMemo, useState } from "react";
import styles from "./master-data.module.css";

const READONLY_ROLES = new Set(["AUDITOR"]);

async function apiFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data;
}

export default function MasterDataWorkspace({ role, initialData }) {
  const [branches, setBranches] = useState(initialData.branches || []);
  const [locations, setLocations] = useState(initialData.locations || []);
  const [bays, setBays] = useState(initialData.bays || []);
  const [employees, setEmployees] = useState(initialData.employees || []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const readOnly = READONLY_ROLES.has(role);

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: `${branch.code} - ${branch.name}`,
      })),
    [branches],
  );

  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: `${location.branch.code} / ${location.name}`,
      })),
    [locations],
  );

  async function loadAll() {
    try {
      setError("");
      const [branchData, locationData, bayData, employeeData] = await Promise.all([
        apiFetch("/api/master/branches"),
        apiFetch("/api/master/locations"),
        apiFetch("/api/master/bays"),
        apiFetch("/api/master/employees"),
      ]);

      setBranches(branchData);
      setLocations(locationData);
      setBays(bayData);
      setEmployees(employeeData);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function handleSubmit(event, url, payloadFactory) {
    event.preventDefault();
    if (readOnly) {
      setError("Your role is read-only.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const payload = payloadFactory(new FormData(event.currentTarget));
      await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      event.currentTarget.reset();
      setMessage("Saved successfully.");
      await loadAll();
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

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Create Branch</h2>
          <form onSubmit={(event) => handleSubmit(event, "/api/master/branches", (form) => ({
            code: form.get("code"),
            name: form.get("name"),
          }))}>
            <input name="code" placeholder="Code (ex: DXB)" required />
            <input name="name" placeholder="Branch Name" required />
            <button disabled={readOnly} type="submit">Save Branch</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Location</h2>
          <form onSubmit={(event) => handleSubmit(event, "/api/master/locations", (form) => ({
            branchId: form.get("branchId"),
            name: form.get("name"),
            floor: form.get("floor"),
            roomCode: form.get("roomCode"),
          }))}>
            <select name="branchId" required>
              <option value="">Select Branch</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input name="name" placeholder="Location Name" required />
            <input name="floor" placeholder="Floor (optional)" />
            <input name="roomCode" placeholder="Room code (optional)" />
            <button disabled={readOnly} type="submit">Save Location</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Bay</h2>
          <form onSubmit={(event) => handleSubmit(event, "/api/master/bays", (form) => ({
            locationId: form.get("locationId"),
            code: form.get("code"),
            description: form.get("description"),
          }))}>
            <select name="locationId" required>
              <option value="">Select Location</option>
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input name="code" placeholder="Bay Number/Code" required />
            <input name="description" placeholder="Description (optional)" />
            <button disabled={readOnly} type="submit">Save Bay</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Employee</h2>
          <form onSubmit={(event) => handleSubmit(event, "/api/master/employees", (form) => ({
            branchId: form.get("branchId"),
            employeeCode: form.get("employeeCode"),
            name: form.get("name"),
            email: form.get("email"),
            department: form.get("department"),
            designation: form.get("designation"),
          }))}>
            <select name="branchId" required>
              <option value="">Select Branch</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input name="employeeCode" placeholder="Employee Code" required />
            <input name="name" placeholder="Employee Name" required />
            <input name="email" placeholder="Email (optional)" type="email" />
            <input name="department" placeholder="Department (optional)" />
            <input name="designation" placeholder="Designation (optional)" />
            <button disabled={readOnly} type="submit">Save Employee</button>
          </form>
        </article>
      </div>

      <div className={styles.tableGrid}>
        <article className={styles.tableCard}>
          <h3>Branches ({branches.length})</h3>
          <ul>
            {branches.map((branch) => (
              <li key={branch.id}>
                <span>{branch.code}</span>
                <span>{branch.name}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.tableCard}>
          <h3>Locations ({locations.length})</h3>
          <ul>
            {locations.map((location) => (
              <li key={location.id}>
                <span>{location.branch.code}</span>
                <span>{location.name}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.tableCard}>
          <h3>Bays ({bays.length})</h3>
          <ul>
            {bays.map((bay) => (
              <li key={bay.id}>
                <span>{bay.location.branch.code}/{bay.location.name}</span>
                <span>{bay.code}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.tableCard}>
          <h3>Employees ({employees.length})</h3>
          <ul>
            {employees.map((employee) => (
              <li key={employee.id}>
                <span>{employee.employeeCode}</span>
                <span>{employee.name}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
