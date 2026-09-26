-- Hotfix: apply the pending migrations ("vip_subscription_and_payment_idempotency"
-- and "series_alerts")
-- to a production database that was provisioned before they existed. The "SeriesAlert" table backs the "notify me" button;
-- without it the button hides itself instead of failing.
--
-- Symptom it fixes: Subscription/CoinTransaction queries crash for logged-in
-- users because `providerRef` / `providerCustomerId` columns are missing. These
-- columns also back the idempotency of the Stripe and RevenueCat webhooks
-- (a replayed event must not credit coins twice).
--
-- Safe to run more than once (IF NOT EXISTS guards). Run it in the Supabase
-- dashboard → SQL Editor, or via psql against the production DATABASE_URL.

ALTER TABLE "CoinTransaction" ADD COLUMN IF NOT EXISTS "providerRef" TEXT;
ALTER TABLE "Subscription"    ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CoinTransaction_providerRef_key"
  ON "CoinTransaction"("providerRef");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_providerId_key"
  ON "Subscription"("providerId");

-- "Notify me" opt-ins (migration 20260926130000_series_alerts).
CREATE TABLE IF NOT EXISTS "SeriesAlert" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "seriesId"     TEXT NOT NULL,
  "afterEpisode" INTEGER NOT NULL,
  "source"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeriesAlert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeriesAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SeriesAlert_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SeriesAlert_userId_seriesId_key"
  ON "SeriesAlert"("userId", "seriesId");
CREATE INDEX IF NOT EXISTS "SeriesAlert_seriesId_createdAt_idx"
  ON "SeriesAlert"("seriesId", "createdAt");

-- Preferred alternative (keeps Prisma migration history in sync):
--   DATABASE_URL="<prod-connection-string>" npx prisma migrate deploy
-- Use that if the database was set up with `prisma migrate` (a
-- `_prisma_migrations` table exists). If it was set up with `prisma db push`,
-- run the statements above instead.
