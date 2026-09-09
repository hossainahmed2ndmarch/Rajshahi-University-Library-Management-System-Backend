-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('LIBRARY_DROP_OFF', 'PICKUP', 'COURIER');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'APPROVED', 'SCHEDULED', 'RECEIVED', 'CATALOGED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "donations" (
    "id" SERIAL NOT NULL,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "contactPhone" TEXT,
    "method" "DonationMethod" NOT NULL DEFAULT 'LIBRARY_DROP_OFF',
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "donorNote" TEXT,
    "bookTitle" TEXT,
    "author" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pickupAddress" TEXT,
    "donorId" INTEGER,
    "receivedById" INTEGER,
    "catalogedBookId" INTEGER,
    "scheduledAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "donations_donorId_idx" ON "donations"("donorId");

-- CreateIndex
CREATE INDEX "donations_receivedById_idx" ON "donations"("receivedById");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_catalogedBookId_fkey" FOREIGN KEY ("catalogedBookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
