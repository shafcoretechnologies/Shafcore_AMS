"use client";

import { useMemo, useState } from "react";
import styles from "./assets.module.css";

const WRITE_ROLES = new Set(["SUPER_ADMIN", "IT_ADMIN", "IT_MANAGER"]);

async function apiFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data || payload;
}

function isDesktopOrLaptop(assetTypes, typeId) {
  const selected = assetTypes.find((item) => item.id === typeId);
  if (!selected) {
    return false;
  }
  const lower = selected.name.toLowerCase();
  return lower.includes("desktop") || lower.includes("laptop");
}

function isPeripheralType(assetTypes, typeId) {
  const selected = assetTypes.find((item) => item.id === typeId);
  if (!selected) {
    return false;
  }
  const lower = selected.name.toLowerCase();
  return lower.includes("mouse") || lower.includes("keyboard") || lower.includes("headset");
}

function getTypeProfile(assetTypes, typeId) {
  if (isDesktopOrLaptop(assetTypes, typeId)) {
    return "COMPUTER";
  }
  if (isPeripheralType(assetTypes, typeId)) {
    return "PERIPHERAL";
  }
  return "GENERAL";
}

function toDateInput(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function buildAssetPayload(form, bays) {
  const bayId = form.get("bayId") || null;
  const selectedBay = bayId ? bays.find((item) => item.id === bayId) : null;
  const rawModelId = form.get("assetModelId");
  return {
    assetTag: form.get("assetTag"),
    assetTypeId: form.get("assetTypeId"),
    assetModelId: rawModelId && rawModelId !== "__new__" ? rawModelId : null,
    modelCreateManufacturer: form.get("modelCreateManufacturer") || null,
    modelCreateName: form.get("modelCreateName") || null,
    branchId: form.get("branchId"),
    locationId: selectedBay?.locationId || null,
    bayId,
    currentEmployeeId: form.get("currentEmployeeId") || null,
    serialNumber: form.get("serialNumber") || null,
    firmwareVersion: form.get("firmwareVersion") || null,
    warrantyExpiry: form.get("warrantyExpiry") || null,
    purchaseDate: form.get("purchaseDate") || null,
    vendorName: form.get("vendorName") || null,
    invoiceNumber: form.get("invoiceNumber") || null,
    invoiceDate: form.get("invoiceDate") || null,
    invoiceAmount: form.get("invoiceAmount") || null,
    invoiceFileUrl: form.get("invoiceFileUrl") || null,
    selectedRamModuleIds: form.getAll("selectedRamModuleIds"),
    selectedStorageDeviceIds: form.getAll("selectedStorageDeviceIds"),
    ramCreateMake: form.get("ramCreateMake") || null,
    ramCreateModel: form.get("ramCreateModel") || null,
    ramCreateVendor: form.get("ramCreateVendor") || null,
    ramCreatePurchaseDate: form.get("ramCreatePurchaseDate") || null,
    ramCreateWarrantyMonths: form.get("ramCreateWarrantyMonths") || null,
    ramCreateSizeGb: form.get("ramCreateSizeGb") || null,
    ramCreateType: form.get("ramCreateType") || null,
    ramCreateSerialNumber: form.get("ramCreateSerialNumber") || null,
    storageCreateMake: form.get("storageCreateMake") || null,
    storageCreateModel: form.get("storageCreateModel") || null,
    storageCreateVendor: form.get("storageCreateVendor") || null,
    storageCreatePurchaseDate: form.get("storageCreatePurchaseDate") || null,
    storageCreateWarrantyMonths: form.get("storageCreateWarrantyMonths") || null,
    storageCreateSizeGb: form.get("storageCreateSizeGb") || null,
    storageCreateType: form.get("storageCreateType") || null,
    storageCreateSerialNumber: form.get("storageCreateSerialNumber") || null,
    notes: form.get("notes") || null,
    serviceTag: form.get("serviceTag") || null,
    ramSizeGb: form.get("ramSizeGb") || null,
    ramSticks: form.get("ramSticks") || null,
    ramFrequencyMhz: form.get("ramFrequencyMhz") || null,
    hddType: form.get("hddType") || null,
    hddSizeGb: form.get("hddSizeGb") || null,
    hddSerialNumber: form.get("hddSerialNumber") || null,
    osVersion: form.get("osVersion") || null,
    make: form.get("make") || null,
    model: form.get("model") || null,
    adapterTagNumber: form.get("adapterTagNumber") || null,
    ramSlotDetails: form.get("ramSlotDetails") || null,
    storageDevices: form.get("storageDevices") || null,
    processorDetails: form.get("processorDetails") || null,
    warrantyValue: form.get("warrantyValue") || null,
    warrantyUnit: form.get("warrantyUnit") || null,
    floor: form.get("floor") || null,
    bayCode: form.get("bayCode") || null,
    repairOrReplacement: form.get("repairOrReplacement") || null,
    replaceAssetId: form.get("replaceAssetId") || null,
  };
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

function Field({ label, htmlFor, children, full = false }) {
  return (
    <div className={`${styles.field}${full ? ` ${styles.fieldFull}` : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function PeripheralFields({ specification, idPrefix = "", replaceCandidates, suggestions }) {
  return (
    <>
      <Field htmlFor={`${idPrefix}make`} label="Make">
        <input
          defaultValue={specification?.make || ""}
          id={`${idPrefix}make`}
          list={`${idPrefix}make-list`}
          name="make"
          placeholder="Required"
          required
        />
        <datalist id={`${idPrefix}make-list`}>
          {suggestions.make.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </Field>
      <Field htmlFor={`${idPrefix}model`} label="Model">
        <input
          defaultValue={specification?.model || ""}
          id={`${idPrefix}model`}
          list={`${idPrefix}model-list`}
          name="model"
          placeholder="Required"
          required
        />
        <datalist id={`${idPrefix}model-list`}>
          {suggestions.model.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </Field>
      <Field htmlFor={`${idPrefix}floor`} label="Floor">
        <input defaultValue={specification?.floor || ""} id={`${idPrefix}floor`} name="floor" placeholder="Required" required />
      </Field>
      <Field htmlFor={`${idPrefix}warrantyValue`} label="Warranty Duration">
        <input
          defaultValue={specification?.warrantyValue || ""}
          id={`${idPrefix}warrantyValue`}
          name="warrantyValue"
          min="1"
          placeholder="Optional"
          type="number"
        />
      </Field>
      <Field htmlFor={`${idPrefix}warrantyUnit`} label="Warranty Unit">
        <select defaultValue={specification?.warrantyUnit || "MONTHS"} id={`${idPrefix}warrantyUnit`} name="warrantyUnit">
          <option value="MONTHS">Months</option>
          <option value="YEARS">Years</option>
        </select>
      </Field>
      <Field htmlFor={`${idPrefix}invoiceDate`} label="Invoice Date">
        <input id={`${idPrefix}invoiceDate`} defaultValue={toDateInput(specification?.invoiceDate)} name="invoiceDate" type="date" />
      </Field>
      <Field htmlFor={`${idPrefix}invoiceAmount`} label="Invoice Amount">
        <input
          defaultValue={specification?.invoiceAmount || ""}
          id={`${idPrefix}invoiceAmount`}
          name="invoiceAmount"
          min="0"
          step="0.01"
          placeholder="Optional"
          type="number"
        />
      </Field>
      <Field htmlFor={`${idPrefix}invoiceFileUrl`} label="Invoice File URL / Reference">
        <input
          defaultValue={specification?.invoiceFileUrl || ""}
          id={`${idPrefix}invoiceFileUrl`}
          name="invoiceFileUrl"
          placeholder="Optional"
        />
      </Field>
      <Field htmlFor={`${idPrefix}repairOrReplacement`} label="Repair / Replacement Action">
        <select defaultValue={specification?.repairOrReplacement || ""} id={`${idPrefix}repairOrReplacement`} name="repairOrReplacement">
          <option value="">Track Action (optional)</option>
          <option value="REPAIR">Send existing to Repair</option>
          <option value="REPLACEMENT">Mark existing as Replaced</option>
        </select>
      </Field>
      <Field htmlFor={`${idPrefix}replaceAssetId`} label="Existing Same-Type Asset">
        <select defaultValue={specification?.replacementForAssetId || ""} id={`${idPrefix}replaceAssetId`} name="replaceAssetId">
          <option value="">Existing same-type asset to replace/repair (optional)</option>
          {replaceCandidates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.assetTag} / {item.bay?.code || "-"} / {item.status}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function ComputerFields({ specification, idPrefix = "", suggestions, ramModules, storageDevices, defaultRamIds = [], defaultStorageIds = [] }) {
  return (
    <>
      <Field htmlFor={`${idPrefix}serviceTag`} label="Service Tag">
        <input defaultValue={specification?.serviceTag || ""} id={`${idPrefix}serviceTag`} name="serviceTag" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}osVersion`} label="OS Version">
        <input defaultValue={specification?.osVersion || ""} id={`${idPrefix}osVersion`} name="osVersion" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}processorDetails`} label="Processor Details">
        <input defaultValue={specification?.processorDetails || ""} id={`${idPrefix}processorDetails`} name="processorDetails" placeholder="Optional" />
      </Field>
      <Field full htmlFor={`${idPrefix}selectedRamModuleIds`} label="RAM Modules (select existing)">
        <select
          className={styles.fullWidthControl}
          defaultValue={defaultRamIds}
          id={`${idPrefix}selectedRamModuleIds`}
          multiple
          name="selectedRamModuleIds"
          size={4}
        >
          {ramModules.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sizeGb}GB {item.type} / SN: {item.serialNumber} / {item.make} {item.model}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateMake`} label="New RAM Make">
        <input id={`${idPrefix}ramCreateMake`} name="ramCreateMake" placeholder="Optional (create new RAM)" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateModel`} label="New RAM Model">
        <input id={`${idPrefix}ramCreateModel`} name="ramCreateModel" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateVendor`} label="New RAM Vendor">
        <input id={`${idPrefix}ramCreateVendor`} name="ramCreateVendor" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreatePurchaseDate`} label="New RAM Purchase Date">
        <input id={`${idPrefix}ramCreatePurchaseDate`} name="ramCreatePurchaseDate" type="date" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateWarrantyMonths`} label="New RAM Warranty (Months)">
        <input id={`${idPrefix}ramCreateWarrantyMonths`} min="1" name="ramCreateWarrantyMonths" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateSizeGb`} label="New RAM Size (GB)">
        <input id={`${idPrefix}ramCreateSizeGb`} min="1" name="ramCreateSizeGb" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateType`} label="New RAM Type">
        <input id={`${idPrefix}ramCreateType`} name="ramCreateType" placeholder="Optional (DDR4/DDR5)" />
      </Field>
      <Field htmlFor={`${idPrefix}ramCreateSerialNumber`} label="New RAM Serial Number">
        <input id={`${idPrefix}ramCreateSerialNumber`} name="ramCreateSerialNumber" placeholder="Optional" />
      </Field>

      <Field full htmlFor={`${idPrefix}selectedStorageDeviceIds`} label="Storage Devices (select existing)">
        <select
          className={styles.fullWidthControl}
          defaultValue={defaultStorageIds}
          id={`${idPrefix}selectedStorageDeviceIds`}
          multiple
          name="selectedStorageDeviceIds"
          size={4}
        >
          {storageDevices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sizeGb}GB {item.type} / SN: {item.serialNumber} / {item.make} {item.model}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateMake`} label="New Storage Make">
        <input id={`${idPrefix}storageCreateMake`} name="storageCreateMake" placeholder="Optional (create new storage)" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateModel`} label="New Storage Model">
        <input id={`${idPrefix}storageCreateModel`} name="storageCreateModel" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateVendor`} label="New Storage Vendor">
        <input id={`${idPrefix}storageCreateVendor`} name="storageCreateVendor" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreatePurchaseDate`} label="New Storage Purchase Date">
        <input id={`${idPrefix}storageCreatePurchaseDate`} name="storageCreatePurchaseDate" type="date" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateWarrantyMonths`} label="New Storage Warranty (Months)">
        <input id={`${idPrefix}storageCreateWarrantyMonths`} min="1" name="storageCreateWarrantyMonths" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateSizeGb`} label="New Storage Size (GB)">
        <input id={`${idPrefix}storageCreateSizeGb`} min="1" name="storageCreateSizeGb" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateType`} label="New Storage Type">
        <input id={`${idPrefix}storageCreateType`} name="storageCreateType" placeholder="Optional (HDD/SSD/NVMe)" />
      </Field>
      <Field htmlFor={`${idPrefix}storageCreateSerialNumber`} label="New Storage Serial Number">
        <input id={`${idPrefix}storageCreateSerialNumber`} name="storageCreateSerialNumber" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}adapterTagNumber`} label="Adapter Tag Number">
        <input
          defaultValue={specification?.adapterTagNumber || ""}
          id={`${idPrefix}adapterTagNumber`}
          list={`${idPrefix}adapter-list`}
          name="adapterTagNumber"
          placeholder="Optional"
        />
        <datalist id={`${idPrefix}adapter-list`}>
          {suggestions.adapterTagNumber.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </Field>
      <Field htmlFor={`${idPrefix}floor`} label="Floor">
        <input defaultValue={specification?.floor || ""} id={`${idPrefix}floor`} name="floor" placeholder="Optional" />
      </Field>
      <Field htmlFor={`${idPrefix}make`} label="Make">
        <input
          defaultValue={specification?.make || ""}
          id={`${idPrefix}make`}
          list={`${idPrefix}make-list`}
          name="make"
          placeholder="Optional"
        />
        <datalist id={`${idPrefix}make-list`}>
          {suggestions.make.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </Field>
      <Field htmlFor={`${idPrefix}warrantyValue`} label="Warranty Duration">
        <input defaultValue={specification?.warrantyValue || ""} id={`${idPrefix}warrantyValue`} name="warrantyValue" min="1" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}warrantyUnit`} label="Warranty Unit">
        <select defaultValue={specification?.warrantyUnit || "MONTHS"} id={`${idPrefix}warrantyUnit`} name="warrantyUnit">
          <option value="MONTHS">Months</option>
          <option value="YEARS">Years</option>
        </select>
      </Field>
      <Field htmlFor={`${idPrefix}invoiceDate`} label="Invoice Date">
        <input id={`${idPrefix}invoiceDate`} defaultValue={toDateInput(specification?.invoiceDate)} name="invoiceDate" type="date" />
      </Field>
      <Field htmlFor={`${idPrefix}invoiceAmount`} label="Invoice Amount">
        <input defaultValue={specification?.invoiceAmount || ""} id={`${idPrefix}invoiceAmount`} name="invoiceAmount" min="0" step="0.01" placeholder="Optional" type="number" />
      </Field>
      <Field htmlFor={`${idPrefix}invoiceFileUrl`} label="Invoice File URL / Reference">
        <input defaultValue={specification?.invoiceFileUrl || ""} id={`${idPrefix}invoiceFileUrl`} name="invoiceFileUrl" placeholder="Optional" />
      </Field>
    </>
  );
}

export default function AssetWorkspace({ role, initialData }) {
  const [assets, setAssets] = useState(initialData.assets || []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [createAssetModelId, setCreateAssetModelId] = useState("");
  const [createBayId, setCreateBayId] = useState("");
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState("");
  const [editAssetModelId, setEditAssetModelId] = useState("");
  const [editBayId, setEditBayId] = useState("");
  const canWrite = WRITE_ROLES.has(role);

  const filteredModels = useMemo(() => {
    if (!selectedTypeId) {
      return initialData.assetModels || [];
    }
    return (initialData.assetModels || []).filter((item) => item.assetTypeId === selectedTypeId);
  }, [initialData.assetModels, selectedTypeId]);

  const editingAsset = useMemo(() => assets.find((item) => item.id === editingAssetId) || null, [assets, editingAssetId]);

  const editingModels = useMemo(() => {
    if (!editingTypeId) {
      return initialData.assetModels || [];
    }
    return (initialData.assetModels || []).filter((item) => item.assetTypeId === editingTypeId);
  }, [initialData.assetModels, editingTypeId]);

  const createTypeProfile = useMemo(() => getTypeProfile(initialData.assetTypes, selectedTypeId), [initialData.assetTypes, selectedTypeId]);
  const editTypeProfile = useMemo(() => getTypeProfile(initialData.assetTypes, editingTypeId), [initialData.assetTypes, editingTypeId]);

  const createTypeAssets = useMemo(
    () => (selectedTypeId ? assets.filter((item) => item.assetTypeId === selectedTypeId) : assets),
    [assets, selectedTypeId],
  );
  const createReplacementCandidates = useMemo(() => assets.filter((item) => item.assetTypeId === selectedTypeId), [assets, selectedTypeId]);
  const editReplacementCandidates = useMemo(() => {
    if (!editingAsset) {
      return [];
    }
    return assets.filter((item) => item.assetTypeId === editingAsset.assetTypeId && item.id !== editingAsset.id);
  }, [assets, editingAsset]);
  const assetsInCreateBay = useMemo(
    () => assets.filter((item) => createBayId && item.bayId === createBayId),
    [assets, createBayId],
  );
  const editBayLabel = useMemo(() => {
    if (!editBayId) {
      return "Unassigned";
    }
    const bay = initialData.bays.find((item) => item.id === editBayId);
    return bay ? `${bay.location.branch.code}/${bay.location.name} / Bay ${bay.code}` : "Unknown Bay";
  }, [editBayId, initialData.bays]);
  const createSuggestions = useMemo(() => {
    const specs = createTypeAssets.map((item) =>
      item.specification && typeof item.specification === "object" ? item.specification : {},
    );
    const knownModels = filteredModels || [];
    return {
      assetTag: uniqueNonEmpty(createTypeAssets.map((item) => item.assetTag)),
      make: uniqueNonEmpty([...specs.map((item) => item.make), ...knownModels.map((item) => item.manufacturer)]),
      model: uniqueNonEmpty([...specs.map((item) => item.model), ...knownModels.map((item) => item.modelName)]),
      adapterTagNumber: uniqueNonEmpty(specs.map((item) => item.adapterTagNumber)),
    };
  }, [createTypeAssets, filteredModels]);
  const editSuggestions = useMemo(() => {
    const editTypeAssets = editingAsset
      ? assets.filter((item) => item.assetTypeId === editingAsset.assetTypeId)
      : [];
    const knownModels = editingTypeId
      ? (initialData.assetModels || []).filter((item) => item.assetTypeId === editingTypeId)
      : [];
    const specs = editTypeAssets.map((item) =>
      item.specification && typeof item.specification === "object" ? item.specification : {},
    );
    return {
      assetTag: uniqueNonEmpty(editTypeAssets.map((item) => item.assetTag)),
      make: uniqueNonEmpty([...specs.map((item) => item.make), ...knownModels.map((item) => item.manufacturer)]),
      model: uniqueNonEmpty([...specs.map((item) => item.model), ...knownModels.map((item) => item.modelName)]),
      adapterTagNumber: uniqueNonEmpty(specs.map((item) => item.adapterTagNumber)),
    };
  }, [assets, editingAsset, editingTypeId, initialData.assetModels]);

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
      const payload = buildAssetPayload(new FormData(event.currentTarget), initialData.bays);
      await apiFetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage("Asset submitted for approval.");
      event.currentTarget.reset();
      setCreateAssetModelId("");
      setCreateBayId("");
      await refreshAssets();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!canWrite || !editingAsset) {
      return;
    }
    try {
      setError("");
      setMessage("");
      const payload = buildAssetPayload(new FormData(event.currentTarget), initialData.bays);
      await apiFetch(`/api/assets/${editingAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage("Asset updated.");
      setEditingAssetId(null);
      setEditingTypeId("");
      setEditAssetModelId("");
      setEditBayId("");
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
        <p className={styles.profileHint}>Profile: {createTypeProfile}</p>
        <p className={styles.intro}>Select asset type first. You can enter make/model manually and still use dropdowns when data exists.</p>
        <form className={styles.form} onSubmit={submitAsset}>
          <Field htmlFor="createAssetTag" label="Asset Tag">
            <input
              id="createAssetTag"
              list="create-asset-tag-list"
              name="assetTag"
              placeholder="Required"
              required
              onBlur={(event) => {
                const typed = event.target.value?.trim().toLowerCase();
                if (!typed) return;
                const existing = createTypeAssets.find((item) => item.assetTag.toLowerCase() === typed);
                if (!existing) return;
                setEditingAssetId(existing.id);
                setEditingTypeId(existing.assetTypeId);
                setEditAssetModelId(existing.assetModelId || "");
                setEditBayId(existing.bayId || "");
              }}
            />
            <datalist id="create-asset-tag-list">
              {createSuggestions.assetTag.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </Field>
          <Field htmlFor="createAssetTypeId" label="Asset Category">
            <select
              id="createAssetTypeId"
              name="assetTypeId"
              required
              value={selectedTypeId}
              onChange={(event) => {
                setSelectedTypeId(event.target.value);
                setCreateAssetModelId("");
              }}
            >
              <option value="">Select Asset Type</option>
              {initialData.assetTypes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="createAssetModelId" label="Model">
            <select
              id="createAssetModelId"
              name="assetModelId"
              value={createAssetModelId}
              onChange={(event) => setCreateAssetModelId(event.target.value)}
            >
              <option value="">Select Model (optional)</option>
              {filteredModels.map((item) => (
                <option key={item.id} value={item.id}>{item.assetType.name} / {item.manufacturer} {item.modelName}</option>
              ))}
              <option value="__new__">+ Create New Model</option>
            </select>
          </Field>
          {createAssetModelId === "__new__" ? (
            <>
              <Field htmlFor="createModelManufacturer" label="New Model Manufacturer">
                <input id="createModelManufacturer" name="modelCreateManufacturer" placeholder="Required for new model" />
              </Field>
              <Field htmlFor="createModelName" label="New Model Name">
                <input id="createModelName" name="modelCreateName" placeholder="Required for new model" />
              </Field>
            </>
          ) : null}
          <Field htmlFor="createBranchId" label="Branch">
            <select id="createBranchId" name="branchId" required>
              <option value="">Select Branch</option>
              {initialData.branches.map((item) => (
                <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="createBayId" label="Workstation Number (Bay/Cubicle)">
            <select id="createBayId" name="bayId" value={createBayId} onChange={(event) => setCreateBayId(event.target.value)}>
              <option value="">Select Location / Bay (optional)</option>
              {initialData.bays.map((item) => (
                <option key={item.id} value={item.id}>{item.location.branch.code}/{item.location.name} / Bay {item.code}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="createEmployeeId" label="Employee">
            <select id="createEmployeeId" name="currentEmployeeId">
              <option value="">Assign to Employee (optional)</option>
              {initialData.employees.map((item) => (
                <option key={item.id} value={item.id}>{item.branch.code} / {item.employeeCode} - {item.name}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="createSerialNumber" label="Serial Number">
            <input id="createSerialNumber" name="serialNumber" placeholder="Optional" />
          </Field>
          {createTypeProfile !== "PERIPHERAL" ? (
            <Field htmlFor="createFirmwareVersion" label="Firmware Version">
              <input id="createFirmwareVersion" name="firmwareVersion" placeholder="Optional" />
            </Field>
          ) : null}
          <Field htmlFor="createVendorName" label="Vendor">
            <input id="createVendorName" name="vendorName" placeholder="Optional" />
          </Field>
          <Field htmlFor="createInvoiceNumber" label="Invoice Number">
            <input id="createInvoiceNumber" name="invoiceNumber" placeholder="Optional" />
          </Field>
          <Field htmlFor="createPurchaseDate" label="Purchase Date">
            <input id="createPurchaseDate" name="purchaseDate" type="date" />
          </Field>
          <Field htmlFor="createWarrantyExpiry" label="Warranty Expiry">
            <input id="createWarrantyExpiry" name="warrantyExpiry" type="date" />
          </Field>

          {createTypeProfile === "COMPUTER" ? (
            <ComputerFields
              defaultRamIds={[]}
              defaultStorageIds={[]}
              idPrefix="create-"
              ramModules={initialData.ramModules || []}
              specification={null}
              storageDevices={initialData.storageDevices || []}
              suggestions={createSuggestions}
            />
          ) : null}
          {createTypeProfile === "PERIPHERAL" ? (
            <PeripheralFields
              idPrefix="create-"
              replaceCandidates={createReplacementCandidates}
              specification={null}
              suggestions={createSuggestions}
            />
          ) : null}
          {createBayId ? (
            <Field full htmlFor="create-bay-assets" label="Assets in selected workstation">
              <div className={styles.bayAssets} id="create-bay-assets">
                {assetsInCreateBay.length ? (
                  assetsInCreateBay.map((item) => (
                    <span key={item.id}>
                      {item.assetTag} ({item.assetType.name})
                    </span>
                  ))
                ) : (
                  <span>No assets mapped in this workstation.</span>
                )}
              </div>
            </Field>
          ) : null}
          <Field full htmlFor="createNotes" label="Notes">
            <textarea id="createNotes" name="notes" placeholder="Optional notes" rows={3} />
          </Field>
          <button disabled={!canWrite} type="submit">Submit for Approval</button>
        </form>
      </article>

      {editingAsset ? (
        <article className={styles.formCard}>
          <h2>Edit Asset</h2>
          <p className={styles.profileHint}>Profile: {editTypeProfile}</p>
          <p className={styles.intro}>Update relevant fields and save. Manual make/model entry is always available.</p>
          <form className={styles.form} onSubmit={submitEdit}>
            <Field htmlFor="editAssetTag" label="Asset Tag">
              <input
                id="editAssetTag"
                defaultValue={editingAsset.assetTag}
                list="edit-asset-tag-list"
                name="assetTag"
                placeholder="Required"
                required
              />
              <datalist id="edit-asset-tag-list">
                {editSuggestions.assetTag.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </Field>
            <Field htmlFor="editAssetTypeId" label="Asset Category">
              <select
                id="editAssetTypeId"
                defaultValue={editingAsset.assetTypeId}
                name="assetTypeId"
                required
                onChange={(event) => {
                  setEditingTypeId(event.target.value);
                  setEditAssetModelId("");
                }}
              >
                <option value="">Select Asset Type</option>
                {initialData.assetTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="editAssetModelId" label="Model">
              <select
                id="editAssetModelId"
                value={editAssetModelId}
                name="assetModelId"
                onChange={(event) => setEditAssetModelId(event.target.value)}
              >
                <option value="">Select Model (optional)</option>
                {editingModels.map((item) => (
                  <option key={item.id} value={item.id}>{item.assetType.name} / {item.manufacturer} {item.modelName}</option>
                ))}
                <option value="__new__">+ Create New Model</option>
              </select>
            </Field>
            {editAssetModelId === "__new__" ? (
              <>
                <Field htmlFor="editModelManufacturer" label="New Model Manufacturer">
                  <input id="editModelManufacturer" name="modelCreateManufacturer" placeholder="Required for new model" />
                </Field>
                <Field htmlFor="editModelName" label="New Model Name">
                  <input id="editModelName" name="modelCreateName" placeholder="Required for new model" />
                </Field>
              </>
            ) : null}
            <Field htmlFor="editBranchId" label="Branch">
              <select id="editBranchId" defaultValue={editingAsset.branchId} name="branchId" required>
                <option value="">Select Branch</option>
                {initialData.branches.map((item) => (
                  <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="editBayId" label="Workstation Number (Bay/Cubicle)">
              <select id="editBayId" value={editBayId} name="bayId" onChange={(event) => setEditBayId(event.target.value)}>
                <option value="">Select Location / Bay (optional)</option>
                {initialData.bays.map((item) => (
                  <option key={item.id} value={item.id}>{item.location.branch.code}/{item.location.name} / Bay {item.code}</option>
                ))}
              </select>
            </Field>
            {editingAsset?.bayId && editBayId && editingAsset.bayId !== editBayId ? (
              <Field full htmlFor="edit-bay-info" label="Mapping Info">
                <div className={styles.warningNote} id="edit-bay-info">
                  This asset is currently mapped to another workstation. Saving will move it to {editBayLabel}.
                </div>
              </Field>
            ) : null}
            <Field htmlFor="editCurrentEmployeeId" label="Employee">
              <select id="editCurrentEmployeeId" defaultValue={editingAsset.currentEmployeeId || ""} name="currentEmployeeId">
                <option value="">Assign to Employee (optional)</option>
                {initialData.employees.map((item) => (
                  <option key={item.id} value={item.id}>{item.branch.code} / {item.employeeCode} - {item.name}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="editSerialNumber" label="Serial Number">
              <input id="editSerialNumber" defaultValue={editingAsset.serialNumber || ""} name="serialNumber" placeholder="Optional" />
            </Field>
            {editTypeProfile !== "PERIPHERAL" ? (
              <Field htmlFor="editFirmwareVersion" label="Firmware Version">
                <input id="editFirmwareVersion" defaultValue={editingAsset.firmwareVersion || ""} name="firmwareVersion" placeholder="Optional" />
              </Field>
            ) : null}
            <Field htmlFor="editVendorName" label="Vendor">
              <input id="editVendorName" defaultValue={editingAsset.vendorName || ""} name="vendorName" placeholder="Optional" />
            </Field>
            <Field htmlFor="editInvoiceNumber" label="Invoice Number">
              <input id="editInvoiceNumber" defaultValue={editingAsset.invoiceNumber || ""} name="invoiceNumber" placeholder="Optional" />
            </Field>
            <Field htmlFor="editPurchaseDate" label="Purchase Date">
              <input id="editPurchaseDate" defaultValue={toDateInput(editingAsset.purchaseDate)} name="purchaseDate" type="date" />
            </Field>
            <Field htmlFor="editWarrantyExpiry" label="Warranty Expiry">
              <input id="editWarrantyExpiry" defaultValue={toDateInput(editingAsset.warrantyExpiry)} name="warrantyExpiry" type="date" />
            </Field>

            {editTypeProfile === "COMPUTER" ? (
              <ComputerFields
                defaultRamIds={(editingAsset.ramModules || []).map((item) => item.ramModuleId)}
                defaultStorageIds={(editingAsset.storageDevices || []).map((item) => item.storageDeviceId)}
                idPrefix="edit-"
                ramModules={initialData.ramModules || []}
                specification={editingAsset.specification}
                storageDevices={initialData.storageDevices || []}
                suggestions={editSuggestions}
              />
            ) : null}
            {editTypeProfile === "PERIPHERAL" ? (
              <PeripheralFields
                idPrefix="edit-"
                replaceCandidates={editReplacementCandidates}
                specification={editingAsset.specification}
                suggestions={editSuggestions}
              />
            ) : null}
            <Field full htmlFor="editNotes" label="Notes">
              <textarea id="editNotes" defaultValue={editingAsset.notes || ""} name="notes" placeholder="Optional notes" rows={3} />
            </Field>
            <div className={styles.formActions}>
              <button disabled={!canWrite} type="submit">Update Asset</button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  setEditingAssetId(null);
                  setEditingTypeId("");
                  setEditAssetModelId("");
                  setEditBayId("");
                }}
              >
                Cancel Edit
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <article className={styles.tableCard}>
        <h3>Recent Assets ({assets.length})</h3>
        <ul>
          {assets.map((asset) => (
            <li key={asset.id}>
              <span>{asset.assetTag}</span>
              <span>{asset.assetType.name}</span>
              <span>{asset.branch.code}</span>
              <span>{asset.approvalStatus}</span>
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => {
                  setEditingAssetId(asset.id);
                  setEditingTypeId(asset.assetTypeId);
                  setEditAssetModelId(asset.assetModelId || "");
                  setEditBayId(asset.bayId || "");
                  setSelectedTypeId(asset.assetTypeId);
                  setCreateAssetModelId(asset.assetModelId || "");
                  setCreateBayId(asset.bayId || "");
                  setMessage("");
                  setError("");
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
