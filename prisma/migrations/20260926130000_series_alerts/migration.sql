-- CreateTable
CREATE TABLE "SeriesAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "afterEpisode" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesAlert_seriesId_createdAt_idx" ON "SeriesAlert"("seriesId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesAlert_userId_seriesId_key" ON "SeriesAlert"("userId", "seriesId");

-- AddForeignKey
ALTER TABLE "SeriesAlert" ADD CONSTRAINT "SeriesAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesAlert" ADD CONSTRAINT "SeriesAlert_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

