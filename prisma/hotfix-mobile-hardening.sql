-- Hotfix: apply the "mobile_hardening" migration to a production database by
-- hand (production does not run `prisma migrate deploy` on Vercel builds).
--
-- Adds two NEW standalone tables only (no change to existing tables):
--   * "DeletedIdentity"  — hashed phone/email tombstones of deleted accounts, so
--                          re-registering does not re-grant the welcome bonus.
--   * "AppleCredential"  — Sign in with Apple refresh tokens, revoked on account
--                          deletion.
--
-- The app tolerates these being absent (it degrades gracefully), so this can be
-- run before or after deploying the code. Safe to run more than once.
-- Run it in the Supabase dashboard -> SQL Editor, via psql against the
-- production DATABASE_URL, or call GET /api/admin/ops?action=migrate.

CREATE TABLE IF NOT EXISTS "DeletedIdentity" (
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeletedIdentity_pkey" PRIMARY KEY ("hash")
);

CREATE TABLE IF NOT EXISTS "AppleCredential" (
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppleCredential_pkey" PRIMARY KEY ("userId")
);

-- If the database was set up with `prisma migrate` (a `_prisma_migrations`
-- table exists), prefer:
--   DATABASE_URL="<prod-connection-string>" npx prisma migrate deploy
-- NOTE: if you ran this file by hand on such a database, mark the migration as
-- applied so `migrate deploy` does not try to re-create the tables:
--   npx prisma migrate resolve --applied 20260926120000_mobile_hardening
