import { PrismaClient } from "@prisma/client";

// Reuse one PrismaClient per Node.js process. Creating a new client in every
// service/middleware can create unnecessary connection pools in production.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__familyExpensePrisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__familyExpensePrisma = prisma;
}
