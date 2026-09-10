# BTS Asset Management

A small, self-hosted asset management web app for **Baltimore Tamu Samaj (BTS)**. It runs on a single BTS computer, needs no Internet connection, and stores everything in one SQLite file that is easy to back up.

Track furniture, electronics, sports and kitchen equipment, office equipment, vehicles, tools, and anything else BTS owns.

## Features

- Login with a JSON Web Token (JWT) session
- Dashboard: totals, value, status breakdown, assets by category and location, recently added assets, recent activity
- Add, edit, view, search, filter, and delete assets
- Per-asset notes and an automatic change history
- Manage categories and locations (deleting one that is still in use is refused)
- Export all assets to CSV
- One-click database backup (saved next to the database in `data/backups`)
- Change the admin password
- Activity log of who did what and when

## Tech stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Backend   | ASP.NET Core 10 Web API, C#, EF Core, SQLite |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS     |
| Packaging | Docker (single image serves API and UI)      |

## Default login

| Username | Password    |
|----------|-------------|
| `admin`  | `admin2016` |

The admin account is created the first time the app starts with an empty database. Change the password from **Admin Settings** after the first login.

## Run with Docker (recommended for the BTS computer)

Requires Docker Desktop.

```bash
docker compose up -d --build
```

Then open <http://localhost:8080>.

- The database and backups are stored in the `./data` folder on the host, so they survive container rebuilds. Copy that folder to a USB drive for an off-machine backup.
- To stop: `docker compose down`. To update after code changes: `docker compose up -d --build`.

Optional settings can be passed as environment variables (or a `.env` file next to `docker-compose.yml`):

| Variable             | Purpose                                              | Default                 |
|----------------------|------------------------------------------------------|-------------------------|
| `BTS_ADMIN_PASSWORD` | Password for the admin account on first start        | `admin2016`             |
| `BTS_JWT_SECRET`     | Secret used to sign login tokens (32+ characters)    | random key generated on first start, saved to `data/jwt.key` |

## Run for development

Backend (API on <http://localhost:5102>, OpenAPI document at `/openapi/v1.json`):

```bash
cd backend
dotnet run --project BtsAssetMgmt.Api
```

In development the database is created at `data/bts.db` in the repository root.

Frontend (Vite dev server on <http://localhost:3000>, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend
dotnet test
```

Tests use an in-memory SQLite database and cover authentication, password hashing, asset CRUD with history, filtering, category and location rules, and dashboard aggregation.

Frontend type-check and production build:

```bash
cd frontend
npm run build
```

## Project layout

```
backend/
  BtsAssetMgmt.Api/             Controllers, Program.cs, appsettings
  BtsAssetMgmt.Core/            Entities, DTOs, service interfaces
  BtsAssetMgmt.Infrastructure/  EF Core DbContext, seeding, service implementations
  BtsAssetMgmt.Tests/           xUnit tests
frontend/
  src/pages/                    Dashboard, Assets, Asset detail, Categories, Locations, Admin, Login
  src/components/               Layout, forms, modal, confirm dialog, shared lookup manager
  src/context/                  Auth and toast providers
data/                           SQLite database and backups (created at runtime)
Dockerfile, docker-compose.yml  Single-container deployment
```

## API overview

All routes are under `/api/v1` and require a `Bearer` token except login.

| Method | Route                          | Notes                          |
|--------|--------------------------------|--------------------------------|
| POST   | `/auth/login`                  | Returns token and user         |
| GET    | `/auth/me`                     | Current user                   |
| GET    | `/assets`                      | `?search=&categoryId=&locationId=&status=` |
| POST   | `/assets`                      |                                |
| GET/PUT/DELETE | `/assets/{id}`         |                                |
| GET    | `/assets/{id}/history`         | Field-level change history     |
| GET/POST | `/assets/{id}/notes`         |                                |
| GET/POST | `/categories`, `/locations`  |                                |
| PUT/DELETE | `/categories/{id}`, `/locations/{id}` | 409 if still in use |
| GET    | `/dashboard/summary`           |                                |
| GET    | `/dashboard/activity?take=20`  |                                |
| GET    | `/admin/export-csv`            | Admin only                     |
| POST   | `/admin/backup`                | Admin only                     |
| GET    | `/admin/backups`               | Admin only                     |
| PUT    | `/admin/change-password`       | Admin only                     |
| GET    | `/health`                      | No auth                        |

## Backups and restore

Backups are SQLite files in `data/backups/`. To restore one, stop the app, replace `data/bts.db` with the backup file (renamed to `bts.db`), delete any `bts.db-wal` and `bts.db-shm` files, and start the app again.

---

Developed by ngurung.
