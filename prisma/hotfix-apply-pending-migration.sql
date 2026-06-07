-- Hotfix: apply the pending "vip_subscription_and_payment_idempotency" migration
-- to a production database that was provisioned before it existed.
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

-- Preferred alternative (keeps Prisma migration history in sync):
--   DATABASE_URL="<prod-connection-string>" npx prisma migrate deploy
-- Use that if the database was set up with `prisma migrate` (a
-- `_prisma_migrations` table exists). If it was set up with `prisma db push`,
-- run the statements above instead.
