import dotenv from "dotenv";
dotenv.config();
import prisma from "./lib/db";

async function main() {
  const users: any = await prisma.$queryRawUnsafe("SELECT id, name, email, role FROM users LIMIT 10");
  console.log("USERS IN DB:", users);

  const count: any = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int as count FROM users");
  console.log("TOTAL USERS COUNT:", count[0].count);
}

main().catch(console.error).finally(() => process.exit(0));
