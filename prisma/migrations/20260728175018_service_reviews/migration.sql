-- CreateTable
CREATE TABLE "service_reviews" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "reviewerName" TEXT,
    "reviewerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_reviews_userId_idx" ON "service_reviews"("userId");

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
