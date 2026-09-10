# BTS Asset Management Application
## Claude Code Implementation Instructions

You are an expert senior software engineer. Build the complete BTS Asset Management application described in this document.

Do not merely provide recommendations or pseudocode. Actually create the project structure, source files, database, API, frontend, Docker configuration, tests, documentation, and CI/CD configuration.

The application is for:

**Baltimore Tamu Samaj (BTS)**

The application is a small, self-hosted asset management system intended to run locally on a BTS computer.

---

# 1. PROJECT GOAL

Build a simple, reliable, local-first asset management web application that BTS can use to track:

- Furniture
- Electronics
- Sports equipment
- Kitchen equipment
- Office equipment
- Vehicles
- Tools
- Other assets

The application must allow authorized users to:

- Log in
- View a dashboard
- Add assets
- Edit assets
- View asset details
- Search assets
- Filter assets
- Delete/deactivate assets
- Add notes/history to assets
- Manage categories
- Manage locations
- Export assets to CSV
- Back up the database
- Change the administrator password
- View recent activity

The application must continue working when the computer has no Internet connection.

---

# 2. IMPORTANT ARCHITECTURE DECISIONS

Use the following architecture unless there is a compelling technical reason not to.

## Backend

Use:

- ASP.NET Core 10 Web API
- C#
- Entity Framework Core
- SQLite

## Frontend

Use:

- React
- TypeScript
- Vite

## Database

Use:

- SQLite

Database file:

```text
/app/data/bts.db
