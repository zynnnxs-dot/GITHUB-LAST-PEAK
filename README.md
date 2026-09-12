# NDREX Fullstack V1

Frontend lama NDREX tetap dipertahankan di `frontend/`.

## Backend
Vercel serverless API:
- `POST /api/login`
- `GET/POST /api/products`
- `GET/POST /api/reseller-access`
- `GET/POST /api/social`
- `POST /api/seed` (protected by `SEED_KEY`)

Database: PostgreSQL via `@vercel/postgres`.

## Environment variables
Set these in Vercel:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` (if provided by the database integration)
- `POSTGRES_URL_NON_POOLING` (if provided)
- `AUTH_SECRET` = random long secret
- `SEED_KEY` = random secret
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Run `schema.sql` once against the database, then call `/api/seed` with header `x-seed-key`.

## Important
This V1 establishes the secure backend/auth/data layer. The existing frontend still needs to be wired to these API endpoints for a complete end-to-end migration. Do not put production passwords in frontend JavaScript.


## 🔐 NDREX ADMIN LOGIN

Kredensial build ini:
- Username: `admin`
- Password: `NDREX2026`

### Vercel
Set Environment Variables:
- `ADMIN_USERNAME` = `admin`
- `ADMIN_PASSWORD` = `NDREX2026`

Set pada Production (dan Preview/Development jika diperlukan), lalu redeploy.

> Jangan mengandalkan password yang tertulis di frontend untuk production. Backend memakai `ADMIN_PASSWORD`. File `.env.example` hanya sebagai panduan.
