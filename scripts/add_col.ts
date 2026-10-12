import prisma from '../src/lib/db';

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE articles ADD COLUMN IF NOT EXISTS "authorBio" TEXT');
  console.log('✓ Added authorBio to articles table');
}

main().catch(console.error).finally(() => prisma.$disconnect());
