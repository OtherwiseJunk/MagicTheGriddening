import { PrismaClient } from "@prisma/client";
import { execFileSync } from "child_process";

const prisma = new PrismaClient();

console.log("Removing duplicate Game rows by dateString...");
const deleted = await prisma.$executeRaw`
  DELETE FROM "Game"
  WHERE id NOT IN (
    SELECT MIN(id) FROM "Game" GROUP BY "dateString"
  )
`;
console.log(`Removed ${Number(deleted)} duplicate game row(s).`);
await prisma.$disconnect();

execFileSync("npx", ["prisma", "db", "push"], { stdio: "inherit" });
