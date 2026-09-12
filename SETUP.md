# Setup Guide

## 1. Prerequisites

- **Node.js** 20 or later
- **npm** 9+
- **MySQL 8** — either via **Docker Desktop** OR a **local MySQL** install (XAMPP, WAMP, MySQL Installer, etc.)

## 2. Install Dependencies

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## 3. Environment Configuration

```bash
cp .env.example .env
```

Default values work with the bundled Docker Compose MySQL setup.

## 4. Start Database

### Option A — Docker (if installed)

```bash
npm run db:up
```

Wait ~15 seconds. Schema and seed load automatically. Use `DB_PORT=3307` in `.env`.

Verify: `docker compose ps`

### Option B — Local MySQL (no Docker)

You likely already have MySQL if you saw `Access denied for user 'onboarding'`.

**1. Update `.env` for local MySQL (port 3306):**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=onboarding
DB_PASSWORD=onboarding_pass
DB_NAME=onboarding_reviewer
```

**2. Create database and user** — open **MySQL Workbench** or command line as `root` and run:

```bash
mysql -u root -p < backend\src\db\setup-local.sql
```

Or paste the contents of `backend/src/db/setup-local.sql` into MySQL Workbench and execute.

**3. Create tables and load sample data:**

```bash
cd backend
npm run db:migrate
```

You should see: `Migration completed successfully.`

## 5. Run the Application

```bash
npm run dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001/api |
| Health   | http://localhost:3001/api/health |

## 6. Run Tests

```bash
cd backend && npm test
```

## 7. Upload Sample Cases

Use the **Upload JSON** button in the UI with files from `data/samples/`:

- `low-risk-case.json` — should auto-approve (exception mode)
- `high-risk-case.json` — should refer for manual review
- `identity-inconsistency-case.json` — should refer due to name mismatch

## 8. Initialise Git (for submission)

```bash
git init
git add .
git commit -m "Initial project scaffold with backend, frontend, and database schema"
git commit -m "Add multi-agent orchestrator and specialist agents" --allow-empty
```

Recommended commit structure:

1. Project scaffold and configuration
2. Database schema, types, and seed data
3. Agent implementations and orchestrator
4. API routes and services
5. React frontend
6. Tests and documentation

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Access denied for user 'onboarding'` | Local MySQL may be using port 3306. This project uses **port 3307** for Docker. Run `docker compose down -v` then `npm run db:up` to reset. Ensure `.env` has `DB_PORT=3307`. |
| `ECONNREFUSED` on port 3307 | Run `npm run db:up` and wait for MySQL |
| Empty case list | Re-run `cd backend && npm run db:migrate` |
| Port 3001 in use | Change `PORT` in `.env` |
| Docker not running | Start Docker Desktop, then `npm run db:up` |
