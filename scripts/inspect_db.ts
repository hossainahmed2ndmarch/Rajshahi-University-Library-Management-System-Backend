import prisma from '../src/lib/db';

async function main() {
  const articleCols: any = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='articles' ORDER BY ordinal_position"
  );
  console.log('ARTICLE COLS:', articleCols);

  const articleCount: any = await prisma.$queryRawUnsafe("SELECT count(*) FROM articles");
  console.log('ARTICLE COUNT:', articleCount);

  const sampleArticles: any = await prisma.$queryRawUnsafe("SELECT * FROM articles LIMIT 3");
  console.log('SAMPLE ARTICLES:', sampleArticles);

  const donationCols: any = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='donations' ORDER BY ordinal_position"
  );
  console.log('DONATION COLS:', donationCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
