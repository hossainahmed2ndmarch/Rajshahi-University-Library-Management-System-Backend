import prisma from '../src/lib/db';

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT');
  console.log('✓ Added slug to books table');
  try {
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS books_slug_key ON books(slug)');
    console.log('✓ Added unique index on books(slug)');
  } catch (e) {
    console.warn('Index notice:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
