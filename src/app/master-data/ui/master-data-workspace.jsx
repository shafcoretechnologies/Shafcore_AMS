"use client";

import { useMemo, useState } from "react";
import styles from "./master-data.module.css";

const READONLY_ROLES = new Set(["AUDITOR"]);
const MASTER_WRITE_ROLES = new Set(["SUPER_ADMIN", "IT_ADMIN"]);
const EMPLOYEE_WRITE_ROLES = new Set(["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"]);
const USER_READ_ROLES = new Set(["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"]);
const USER_WRITE_ROLES = new Set(["SUPER_ADMIN", "IT_MANAGER"]);
const USER_ROLE_OPTIONS = ["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER", "AUDITOR"];

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
  const [users, setUsers] = useState(initialData.users || []);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [employeeDraft, setEmployeeDraft] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userDraft, setUserDraft] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const readOnly = READONLY_ROLES.has(role);
  const canWriteMaster = MASTER_WRITE_ROLES.has(role);
  const canWriteEmployees = EMPLOYEE_WRITE_ROLES.has(role);
  const canReadUsers = USER_READ_ROLES.has(role);
  const canWriteUsers = USER_WRITE_ROLES.has(role);

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
      const requests = [
        apiFetch("/api/master/branches"),
        apiFetch("/api/master/locations"),
        apiFetch("/api/master/bays"),
        apiFetch("/api/master/employees"),
      ];
      if (canReadUsers) {
        requests.push(apiFetch("/api/master/users"));
      }

      const [branchData, locationData, bayData, employeeData, userData] = await Promise.all(requests);

      setBranches(branchData);
      setLocations(locationData);
      setBays(bayData);
      setEmployees(employeeData);
      if (canReadUsers) {
        setUsers(userData || []);
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function submitJson(url, payload, options = {}) {
    const { method = "POST", canWrite = true, forbiddenMessage = "Your role cannot perform this action." } = options;
    if (!canWrite || readOnly) {
      setError(readOnly ? "Your role is read-only." : forbiddenMessage);
      return;
    }

    try {
      setError("");
      setMessage("");
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage("Saved successfully.");
      await loadAll();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  function startEditEmployee(employee) {
    setEditingEmployeeId(employee.id);
    setEmployeeDraft({
      branchId: employee.branchId,
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email || "",
      department: employee.department || "",
      designation: employee.designation || "",
    });
  }

  function startEditUser(user) {
    setEditingUserId(user.id);
    setUserDraft({
      name: user.name,
      role: user.role,
      password: "",
    });
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
          <form onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submitJson("/api/master/branches", {
              code: form.get("code"),
              name: form.get("name"),
            }, {
              canWrite: canWriteMaster,
              forbiddenMessage: "Only Super Admin or IT Admin can manage branches.",
            });
            event.currentTarget.reset();
          }}>
            <input name="code" placeholder="Code (ex: DXB)" required />
            <input name="name" placeholder="Branch Name" required />
            <button disabled={!canWriteMaster || readOnly} type="submit">Save Branch</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Location</h2>
          <form onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submitJson("/api/master/locations", {
              branchId: form.get("branchId"),
              name: form.get("name"),
              floor: form.get("floor"),
              roomCode: form.get("roomCode"),
            }, {
              canWrite: canWriteMaster,
              forbiddenMessage: "Only Super Admin or IT Admin can manage locations.",
            });
            event.currentTarget.reset();
          }}>
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
            <button disabled={!canWriteMaster || readOnly} type="submit">Save Location</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Bay</h2>
          <form onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submitJson("/api/master/bays", {
              locationId: form.get("locationId"),
              code: form.get("code"),
              description: form.get("description"),
            }, {
              canWrite: canWriteMaster,
              forbiddenMessage: "Only Super Admin or IT Admin can manage bays.",
            });
            event.currentTarget.reset();
          }}>
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
            <button disabled={!canWriteMaster || readOnly} type="submit">Save Bay</button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Create Employee</h2>
          <form onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submitJson("/api/master/employees", {
              branchId: form.get("branchId"),
              employeeCode: form.get("employeeCode"),
              name: form.get("name"),
              email: form.get("email"),
              department: form.get("department"),
              designation: form.get("designation"),
            }, {
              canWrite: canWriteEmployees,
              forbiddenMessage: "Only Super Admin, IT Admin, or IT Manager can manage employees.",
            });
            event.currentTarget.reset();
          }}>
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
            <button disabled={!canWriteEmployees || readOnly} type="submit">Save Employee</button>
          </form>
        </article>

        {canReadUsers ? (
          <article className={styles.card}>
            <h2>Create User</h2>
            <form onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await submitJson("/api/master/users", {
                name: form.get("name"),
                email: form.get("email"),
                role: form.get("role"),
                password: form.get("password"),
              }, {
                canWrite: canWriteUsers,
                forbiddenMessage: "Only Super Admin or IT Manager can create users.",
              });
              event.currentTarget.reset();
            }}>
              <input name="name" placeholder="Full Name" required />
              <input name="email" placeholder="Email" type="email" required />
              <select name="role" defaultValue="IT_ADMIN" required>
                {USER_ROLE_OPTIONS.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName}
                  </option>
                ))}
              </select>
              <input name="password" placeholder="Temporary Password (min 12 chars)" minLength={12} required />
              <button disabled={!canWriteUsers || readOnly} type="submit">Save User</button>
            </form>
          </article>
        ) : null}
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
                {editingEmployeeId === employee.id && employeeDraft ? (
                  <div className={styles.inlineEditor}>
                    <select
                      value={employeeDraft.branchId}
                      onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, branchId: event.target.value }))}
                    >
                      <option value="">Select Branch</option>
                      {branchOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={employeeDraft.employeeCode}
                      onChange={(event) =>
                        setEmployeeDraft((prev) => ({ ...prev, employeeCode: event.target.value }))
                      }
                      placeholder="Employee Code"
                    />
                    <input
                      value={employeeDraft.name}
                      onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Employee Name"
                    />
                    <input
                      value={employeeDraft.email}
                      onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="Email"
                      type="email"
                    />
                    <input
                      value={employeeDraft.department}
                      onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, department: event.target.value }))}
                      placeholder="Department"
                    />
                    <input
                      value={employeeDraft.designation}
                      onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, designation: event.target.value }))}
                      placeholder="Designation"
                    />
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        disabled={!canWriteEmployees || readOnly}
                        onClick={async () => {
                          await submitJson(`/api/master/employees/${employee.id}`, employeeDraft, {
                            method: "PATCH",
                            canWrite: canWriteEmployees,
                            forbiddenMessage: "Only Super Admin, IT Admin, or IT Manager can update employees.",
                          });
                          setEditingEmployeeId(null);
                          setEmployeeDraft(null);
                        }}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployeeId(null);
                          setEmployeeDraft(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{employee.employeeCode}</span>
                    <span>{employee.name}</span>
                    <button
                      type="button"
                      disabled={!canWriteEmployees || readOnly}
                      onClick={() => startEditEmployee(employee)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </article>

        {canReadUsers ? (
          <article className={styles.tableCard}>
            <h3>Users ({users.length})</h3>
            <ul>
              {users.map((user) => (
                <li key={user.id}>
                  {editingUserId === user.id && userDraft ? (
                    <div className={styles.inlineEditor}>
                      <input
                        value={userDraft.name}
                        onChange={(event) => setUserDraft((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Name"
                      />
                      <select
                        value={userDraft.role}
                        onChange={(event) => setUserDraft((prev) => ({ ...prev, role: event.target.value }))}
                      >
                        {USER_ROLE_OPTIONS.map((roleName) => (
                          <option key={roleName} value={roleName}>
                            {roleName}
                          </option>
                        ))}
                      </select>
                      <input
                        value={userDraft.password}
                        onChange={(event) => setUserDraft((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="New Password (optional, min 12 chars)"
                        minLength={12}
                      />
                      <div className={styles.inlineActions}>
                        <button
                          type="button"
                          disabled={!canWriteUsers || readOnly}
                          onClick={async () => {
                            const payload = {
                              name: userDraft.name,
                              role: userDraft.role,
                            };
                            if (userDraft.password) {
                              payload.password = userDraft.password;
                            }
                            await submitJson(`/api/master/users/${user.id}`, payload, {
                              method: "PATCH",
                              canWrite: canWriteUsers,
                              forbiddenMessage: "Only Super Admin or IT Manager can update users.",
                            });
                            setEditingUserId(null);
                            setUserDraft(null);
                          }}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null);
                            setUserDraft(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{user.email}</span>
                      <span>{user.role}</span>
                      <button
                        type="button"
                        disabled={!canWriteUsers || readOnly}
                        onClick={() => startEditUser(user)}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
