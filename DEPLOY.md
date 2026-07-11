# Production Cutover — `feature/marketplace-completion`

This branch introduces **Prisma migrations** to a project that previously managed
its database with `prisma db push`. As a result the production database has the
current schema but **no migration history** (no `_prisma_migrations` table, or an
empty one). You must **baseline** production before the first `migrate deploy`, or
Prisma will see the whole schema as "drift" and try to reset the database.

The migrations in this branch are:

```
prisma/migrations/
├─ 0_init/                                   # full CURRENT schema (already in prod)
└─ 20260710205357_contractor_signup_and_reviews/   # additive delta (the new work)
```

`0_init` describes the schema that production **already has**, so it must be marked
as *already applied* (not run). Only the delta migration should actually execute.

The delta is **purely additive** — no drops, no renames, no data loss:

- `Contractor`: add nullable `userId` (unique), `contactName`, `whatsapp`
- New `Review` table + `Review_contractorId_idx` index + FK to `Contractor`

---

## One-time cutover (run once, before/at first deploy of this branch)

Run these against the **production** database. Set `DATABASE_URL` to the prod
connection string first (do **not** rely on `.env.local`, which points at the
`dev-marketplace` Neon branch).

```bash
# 1. Point at PRODUCTION (use the prod Neon connection string)
export DATABASE_URL="postgresql://USER:PASSWORD@PROD-HOST/DB?sslmode=require"

# 2. Baseline: tell Prisma the existing schema (0_init) is already applied.
#    This creates/records the _prisma_migrations row WITHOUT running the SQL,
#    so nothing in prod is recreated or dropped.
npx prisma migrate resolve --applied 0_init

# 3. Apply ONLY the additive delta (adds Contractor columns + Review table).
npx prisma migrate deploy

# 4. Verify — should print "Database schema is up to date!"
npx prisma migrate status
```

Expected output of step 3:

```
Applying migration `20260710205357_contractor_signup_and_reviews`
All migrations have been successfully applied.
```

After this, normal deploys just run `prisma migrate deploy` (already part of the
`build` script via `prisma generate` + Next build on Vercel — but `migrate deploy`
itself is **not** in `build`; run it as a deploy/release step).

---

## If a deploy platform runs `migrate deploy` automatically

If your pipeline (e.g. a Vercel "Build Command" or release phase) already runs
`prisma migrate deploy`, the **baseline in step 2 must still happen first**, once,
before that automated deploy — otherwise `migrate deploy` will fail with a
`P3005` "database schema is not empty" error. Do step 2 manually against prod one
time, then let the pipeline take over.

---

## Rollback

The delta only adds columns/a table, so rolling back the app code is safe — the
added `Contractor` columns are nullable and the `Review` table is simply unused by
the old code. If you must remove them:

```sql
DROP TABLE "Review";
ALTER TABLE "Contractor" DROP COLUMN "userId", DROP COLUMN "contactName", DROP COLUMN "whatsapp";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260710205357_contractor_signup_and_reviews';
```

---

## Environment variables

No new env vars are required by this branch. Existing ones (`DATABASE_URL`, Clerk,
Stripe incl. `STRIPE_LEAD_PRICE_ID`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`,
`NEXT_PUBLIC_BASE_URL`) already cover it. Ensure `STRIPE_LEAD_PRICE_ID` is set in
prod so Free/Pro homeowners can pay the one-time lead fee.
