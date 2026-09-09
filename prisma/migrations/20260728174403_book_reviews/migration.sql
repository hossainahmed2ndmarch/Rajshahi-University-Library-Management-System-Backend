-- CreateTable
CREATE TABLE "book_reviews" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_reviews_bookId_idx" ON "book_reviews"("bookId");

-- CreateIndex
CREATE INDEX "book_reviews_userId_idx" ON "book_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "book_reviews_userId_bookId_key" ON "book_reviews"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
