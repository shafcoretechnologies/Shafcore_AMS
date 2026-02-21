# Asset Management Architecture (Next.js + PostgreSQL)

## 1) Core design goals
- One base platform that works for IT assets now and other asset categories later.
- Asset records can be added:
  - Individually
  - By location
  - By bay
- Full assignment tracking (employee/location/bay history).
- Approval workflow (IT Admin submits, IT Manager approves/rejects).
- Reporting-first schema for bay search, warranty expiry, and firmware tracking.

## 2) Entity map
- `Branch` -> `Location` -> `Bay`
- `Employee` belongs to `Branch`
- `AssetType` (Laptop, Desktop, Firewall, etc.)
- `AssetModel` for reusable model-level specs
- `Asset` for each physical item (serial optional for generic items)
- `AssetAssignment` for movement history
- `AssetApproval` for manager approval lifecycle
- `FirmwareHistory` for version updates over time
- `AssetAuditLog` for audit events

## 3) Why this supports your requirements
- Multiple branches: `Branch` root entity.
- Bay-level reporting: `Asset` stores `bayId`; report endpoint fetches full bay inventory.
- Employee tagging: `currentEmployeeId` + assignment history.
- Warranty + firmware: first-class fields on `Asset` and `FirmwareHistory`.
- Approval: every asset creation creates an `AssetApproval` in `PENDING`.
- Optional serial number: `serialNumber` is nullable, while `AssetType.requiresSerial` enforces serial for required categories.
- Complex bundles: `Asset.parentAssetId` supports relationships like workstation + dual monitor + headset adapter set.

## 4) Base workflows
### Add asset
1. IT Admin submits asset to `POST /api/assets`.
2. Asset is saved as `approvalStatus=PENDING`.
3. Approval row is created with action `CREATE`.

### Approve or reject
1. IT Manager calls `PATCH /api/approvals/:approvalId`.
2. Approval status and asset approval state are updated together in one transaction.

### Bay report
1. Call `GET /api/reports/bays/:bayCode?branchCode=HQ`.
2. Response includes all assets in the bay + nested bundle items.

## 5) Reporting queries you should build next
- Warranty expiring in 30/60/90 days (group by branch and asset type).
- Firmware outdated by type/model.
- Assets pending manager approval.
- Assets unassigned (in stock) by location.
- Employee asset profile (all active + historical allocations).

## 6) Suggested module order
1. Authentication + role checks (`IT_ADMIN`, `IT_MANAGER`).
2. Master data screens (Branch/Location/Bay/Employee/AssetType/AssetModel).
3. Asset create/edit with approval request screen.
4. Assignment and transfer screen.
5. Reporting dashboard.

## 7) Extend to non-IT assets later
- Keep `Asset` generic.
- Add new `AssetType` rows (vehicle, furniture, tools, etc.).
- Put category-specific details in `Asset.specification` JSON, or add subtype tables when needed.
