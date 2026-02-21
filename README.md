# Shafcore AMS (Next.js + PostgreSQL)

Starter platform for IT asset lifecycle management with branch/location/bay structure, approvals, firmware/warranty tracking, and reporting.

## Features
- Multi-branch hierarchy: `Branch -> Location -> Bay`
- Asset registry with optional serial number support
- Employee tagging and assignment history
- Approval flow: IT Admin request, IT Manager review
- Secure authentication with DB-backed sessions
- Role-based API authorization (`SUPER_ADMIN`, `IT_ADMIN`, `IT_MANAGER`, `AUDITOR`)
- Warranty expiry and firmware tracking
- Bay-level report API (search like Bay `12`)
- Extendable schema for non-IT asset categories

## Tech stack
- Next.js (App Router)
- PostgreSQL
- Prisma ORM

## Project structure
- `prisma/schema.prisma`: database schema
- `prisma/seed.js`: starter seed data
- `src/app/login/page.js`: secure login page
- `src/app/master-data/page.js`: master data management UI
- `src/app/assets/page.js`: asset onboarding UI
- `src/app/approvals/page.js`: approval inbox UI
- `src/app/profile/page.js`: account security and password change UI
- `src/app/api/auth/login/route.js`: login + bootstrap password setup
- `src/app/api/auth/logout/route.js`: logout endpoint
- `src/app/api/assets/route.js`: asset list/create
- `src/app/api/approvals/[approvalId]/route.js`: approve/reject
- `src/app/api/reports/bays/[bayCode]/route.js`: bay report
- `docs/ARCHITECTURE.md`: domain and workflow design

## PostgreSQL setup (Windows)
1. Install PostgreSQL and keep note of:
   - username (`postgres`)
   - password
   - port (`5432`)
2. Create database:
```sql
CREATE DATABASE asset_management;
```

## Environment setup
Prisma CLI uses `.env` in project root.

1. Copy `.env.example` to `.env`
2. Set connection string:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/asset_management?schema=public"
SEED_DEFAULT_PASSWORD="ChangeMeNow123!"
AUTH_BOOTSTRAP_SECRET="replace-with-a-long-random-secret"
```

Note:
- `.env.local` is used by Next.js runtime.
- Prisma migrate/generate requires `.env` unless you explicitly pass env vars.

## Install and run
```bash
npm install
npm run db:generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## NPM scripts
```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:seed       # node prisma/seed.js
npm run db:studio     # prisma studio
```

## API endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/password`
- `GET /api/assets`
- `POST /api/assets`
- `PATCH /api/approvals/:approvalId`
- `GET /api/reports/bays/:bayCode?branchCode=HQ`
- `GET /api/master/branches` / `POST /api/master/branches`
- `GET /api/master/locations` / `POST /api/master/locations`
- `GET /api/master/bays` / `POST /api/master/bays`
- `GET /api/master/employees` / `POST /api/master/employees`
- `GET /api/master/asset-types` / `POST /api/master/asset-types`
- `GET /api/master/asset-models` / `POST /api/master/asset-models`
- `GET /api/approvals`

## Security model
- Password hashes: `scrypt` with per-user random salt
- Sessions: random 256-bit token, stored as SHA-256 hash in DB
- Cookie: HTTP-only, secure in production, same-site policy enabled
- Brute-force protection: login rate limiting by email+IP
- State-changing endpoints: same-origin checks to reduce CSRF risk
- Role checks are server-side in API handlers (request body cannot override roles/user IDs)
- Password change requires current password and enforces strong password policy

## Roles and endpoint access
- `SUPER_ADMIN`: full access
- `IT_ADMIN`: asset create/read, reports
- `IT_MANAGER`: approvals + read/report access
- `AUDITOR`: read/report access only

Protected endpoints:
- `GET /api/assets`: `SUPER_ADMIN`, `IT_ADMIN`, `IT_MANAGER`, `AUDITOR`
- `POST /api/assets`: `SUPER_ADMIN`, `IT_ADMIN`
- `PATCH /api/approvals/:approvalId`: `SUPER_ADMIN`, `IT_MANAGER`
- `GET /api/reports/bays/:bayCode`: `SUPER_ADMIN`, `IT_ADMIN`, `IT_MANAGER`, `AUDITOR`

## Seed data details
`npm run db:seed` inserts starter records for development/testing:
- Branch: `HQ`
- Location: `IT Floor`
- Bays: `12`, `13`
- Users:
  - `it.admin@company.local`
  - `it.manager@company.local`
  - both users get password from `SEED_DEFAULT_PASSWORD`
- Asset types:
  - Laptop
  - Desktop
  - Server
  - Storage HDD
  - Switch
  - Firewall
  - NVR
  - DVR
  - IP Phone
  - IP Camera
  - Monitor
  - Keyboard
  - Mouse
  - Headset
  - Headset Adapter
  - RAM
  - Processor

## Add new asset categories
Use either approach:

1. Prisma Studio:
```bash
npm run db:studio
```
Add rows in `AssetType` and optionally `AssetModel`.

2. Seed file:
- Update `IT_ASSET_TYPES` in `prisma/seed.js`
- Run:
```bash
npm run db:seed
```

## Common issues and fixes

### `Environment variable not found: DATABASE_URL`
Cause:
- `DATABASE_URL` only in `.env.local`

Fix:
- Add the same variable to root `.env`

### Prisma package/module errors like:
- `Cannot find module .../destr/dist/index.mjs`
- `Cannot find module .../confbox/dist/index.mjs`

Cause:
- Corrupted/incomplete `node_modules`

Fix:
```powershell
[System.IO.Directory]::Delete('node_modules', $true)
npm ci
npm run db:generate
```

### `P1002` advisory lock timeout during migration
Cause:
- Another migration/session holds Prisma lock

Fix:
1. Close other Node/Prisma terminals
2. Restart PostgreSQL service
3. In pgAdmin run:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'asset_management'
  AND pid <> pg_backend_pid();
```
4. Retry:
```bash
npx prisma migrate dev --name init
```

### Login fails with `Invalid credentials`
Cause:
- Seeded users exist but no password was set yet (old seed) or password changed.

Fix:
1. Run seed again after latest migration:
```bash
npm run db:seed
```
2. Or set password via bootstrap endpoint:
```bash
curl -X PATCH http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"it.admin@company.local\",\"newPassword\":\"StrongPassword123!\",\"setupSecret\":\"YOUR_AUTH_BOOTSTRAP_SECRET\"}"
```

## Next development steps
1. Build master data screens (Branch/Location/Bay/Employee)
2. Build asset create/edit and approval inbox UI
3. Build report pages on top of existing APIs
4. Add audit log UI and session management screen
5. Add tests for auth, asset creation, approval, and bay reporting

## Architecture reference
See `docs/ARCHITECTURE.md` for detailed data model and workflow rationale.
