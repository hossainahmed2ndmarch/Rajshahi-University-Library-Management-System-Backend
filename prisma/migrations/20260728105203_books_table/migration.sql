-- CreateEnum
CREATE TYPE "BookType" AS ENUM ('BORROW_ONLY', 'SELL_ONLY', 'HYBRID');

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publisher" TEXT,
    "pages" INTEGER NOT NULL,
    "type" "BookType" NOT NULL,
    "sellPrice" DOUBLE PRECISION,
    "borrowStock" INTEGER NOT NULL DEFAULT 0,
    "sellStock" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "donatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_type_idx" ON "books"("type");

-- CreateIndex
CREATE INDEX "books_category_idx" ON "books"("category");

-- CreateIndex
CREATE INDEX "books_isArchived_idx" ON "books"("isArchived");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_donatedById_fkey" FOREIGN KEY ("donatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
