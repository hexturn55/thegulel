-- AlterTable
ALTER TABLE "CoinTransaction" ADD COLUMN     "providerRef" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "providerCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_providerRef_key" ON "CoinTransaction"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerId_key" ON "Subscription"("providerId");
