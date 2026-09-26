-- CreateTable
CREATE TABLE "DeletedIdentity" (
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedIdentity_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "AppleCredential" (
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppleCredential_pkey" PRIMARY KEY ("userId")
);
