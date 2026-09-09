-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "shift_logs" (
    "id" SERIAL NOT NULL,
    "shifterId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "ShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "openingCash" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cashCollected" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "closingCash" DOUBLE PRECISION,
    "tasksCompleted" TEXT,
    "handoverNotes" TEXT,
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_logs_shifterId_idx" ON "shift_logs"("shifterId");

-- CreateIndex
CREATE INDEX "shift_logs_status_idx" ON "shift_logs"("status");

-- AddForeignKey
ALTER TABLE "shift_logs" ADD CONSTRAINT "shift_logs_shifterId_fkey" FOREIGN KEY ("shifterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_logs" ADD CONSTRAINT "shift_logs_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
