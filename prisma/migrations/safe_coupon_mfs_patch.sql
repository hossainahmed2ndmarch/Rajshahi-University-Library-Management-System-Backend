-- Add safely without dropping any legacy columns

DO $$ BEGIN
    CREATE TYPE "MFSProvider" AS ENUM ('BKASH', 'NAGAD', 'ROCKET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DeliveryMethod" AS ENUM ('COURIER', 'PICKUP', 'POS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter PaymentMethod Enum safely
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BKASH';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'NAGAD';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ROCKET';

-- Alter PaymentStatus Enum safely
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_VERIFICATION';

-- Alter Table Payments
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "customerTrxId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "mfsProvider" "MFSProvider";
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "senderPhone" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- Create Coupons Table
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "CouponDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_isActive_idx" ON "coupons"("isActive");

-- Alter Table Purchases safely
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "couponId" INTEGER;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "customerTrxId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'COURIER';
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "deliveryOtpHash" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "mfsProvider" "MFSProvider";
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "otpVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "paymentVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "senderPhone" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

DO $$ BEGIN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
