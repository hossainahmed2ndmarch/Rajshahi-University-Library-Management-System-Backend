import prisma from '../src/lib/db';

async function main() {
  console.log('--- Starting safe schema migration & data normalization ---');

  // 1. Create publishers table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "publishers" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "logo" TEXT,
      "description" TEXT,
      "websiteUrl" TEXT,
      "defaultDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ "publishers" table verified');

  // 2. Create AuthorRole enum
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "AuthorRole" AS ENUM ('WRITER', 'TRANSLATOR', 'EDITOR', 'COMPILER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log('✓ "AuthorRole" enum verified');

  // 3. Create authors table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "authors" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER UNIQUE,
      "name" TEXT NOT NULL,
      "avatar" TEXT,
      "bio" TEXT,
      "authorDesignation" TEXT,
      "socialLinks" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "authors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "authors_userId_idx" ON "authors"("userId");
  `);
  console.log('✓ "authors" table verified');

  // 4. Create book_authors junction table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "book_authors" (
      "id" SERIAL PRIMARY KEY,
      "bookId" INTEGER NOT NULL,
      "authorId" INTEGER NOT NULL,
      "role" "AuthorRole" NOT NULL DEFAULT 'WRITER',
      CONSTRAINT "book_authors_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "book_authors_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "book_authors_bookId_authorId_role_key" UNIQUE ("bookId", "authorId", "role")
    );
    CREATE INDEX IF NOT EXISTS "book_authors_bookId_idx" ON "book_authors"("bookId");
    CREATE INDEX IF NOT EXISTS "book_authors_authorId_idx" ON "book_authors"("authorId");
  `);
  console.log('✓ "book_authors" table verified');

  // 5. Add columns to books table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "publisherId" INTEGER REFERENCES "publishers"("id") ON DELETE SET NULL;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "customDiscount" DECIMAL(5,2);
    CREATE INDEX IF NOT EXISTS "books_publisherId_idx" ON "books"("publisherId");
  `);
  console.log('✓ "books" new columns (publisherId, customDiscount) verified');

  // 6. Add authorId to articles table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "authorId" INTEGER REFERENCES "authors"("id") ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS "articles_authorId_idx" ON "articles"("authorId");
  `);
  console.log('✓ "articles" new column (authorId) verified');

  // --- DATA MIGRATION ---

  // A. Migrate publishers from books
  const distinctPublishers: any = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT TRIM(publisher) AS name FROM books WHERE publisher IS NOT NULL AND TRIM(publisher) != ''
  `);
  for (const pub of distinctPublishers) {
    if (!pub.name) continue;
    await prisma.$executeRawUnsafe(
      `INSERT INTO publishers (name, "defaultDiscount") VALUES ($1, 0.00) ON CONFLICT (name) DO NOTHING`,
      pub.name
    );
  }
  await prisma.$executeRawUnsafe(`
    UPDATE books b
    SET "publisherId" = p.id
    FROM publishers p
    WHERE TRIM(b.publisher) = p.name AND b."publisherId" IS NULL;
  `);
  console.log(`✓ Migrated ${distinctPublishers.length} publishers & linked to books`);

  // B. Migrate discounts to customDiscount
  await prisma.$executeRawUnsafe(`
    UPDATE books
    SET "customDiscount" = discount::numeric
    WHERE discount IS NOT NULL AND "customDiscount" IS NULL;
  `);
  console.log('✓ Migrated book discounts to customDiscount');

  // C. Migrate authors from books
  const books: any = await prisma.$queryRawUnsafe(`
    SELECT id, author, authors FROM books
  `);

  let authorCount = 0;
  let bookAuthorCount = 0;

  for (const book of books) {
    const rawAuthorStr = book.author;
    const authorItems: { name: string; role: string }[] = [];

    // Check if JSON authors array exists
    if (Array.isArray(book.authors) && book.authors.length > 0) {
      for (const a of book.authors) {
        if (a && a.name && a.name.trim()) {
          authorItems.push({
            name: a.name.trim(),
            role: a.role === 'TRANSLATOR' ? 'TRANSLATOR' : 'WRITER',
          });
        }
      }
    } else if (rawAuthorStr && rawAuthorStr.trim()) {
      // Split by comma if multiple authors in string
      const splitAuthors = rawAuthorStr
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      for (const name of splitAuthors) {
        authorItems.push({ name, role: 'WRITER' });
      }
    }

    for (const item of authorItems) {
      // Find or create Author
      let authorRecord: any = await prisma.$queryRawUnsafe(
        `SELECT id FROM authors WHERE name = $1 LIMIT 1`,
        item.name
      );

      let authorId: number;
      if (authorRecord && authorRecord.length > 0) {
        authorId = authorRecord[0].id;
      } else {
        const inserted: any = await prisma.$queryRawUnsafe(
          `INSERT INTO authors (name) VALUES ($1) RETURNING id`,
          item.name
        );
        authorId = inserted[0].id;
        authorCount++;
      }

      // Link to BookAuthor
      await prisma.$executeRawUnsafe(
        `INSERT INTO book_authors ("bookId", "authorId", role)
         VALUES ($1, $2, $3::"AuthorRole")
         ON CONFLICT ("bookId", "authorId", role) DO NOTHING`,
        book.id,
        authorId,
        item.role
      );
      bookAuthorCount++;
    }
  }
  console.log(`✓ Migrated ${authorCount} new authors and linked ${bookAuthorCount} book-author relations`);

  // D. Migrate authors for existing articles
  const articles: any = await prisma.$queryRawUnsafe(`
    SELECT id, "authorName", "authorDesignation", "authorUserId", "authorId" FROM articles
  `);

  for (const article of articles) {
    if (article.authorId) continue;
    const name = article.authorName?.trim() || 'Contributor';

    let authorRecord: any = await prisma.$queryRawUnsafe(
      `SELECT id FROM authors WHERE name = $1 LIMIT 1`,
      name
    );

    let authorId: number;
    if (authorRecord && authorRecord.length > 0) {
      authorId = authorRecord[0].id;
    } else {
      const inserted: any = await prisma.$queryRawUnsafe(
        `INSERT INTO authors (name, "authorDesignation", "userId") VALUES ($1, $2, $3) RETURNING id`,
        name,
        article.authorDesignation || null,
        article.authorUserId || null
      );
      authorId = inserted[0].id;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE articles SET "authorId" = $1 WHERE id = $2`,
      authorId,
      article.id
    );
  }
  console.log(`✓ Linked ${articles.length} articles to author records`);

  console.log('--- Migration completed successfully! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
