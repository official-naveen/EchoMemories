import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5 })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis

export const prisma = globalForPrisma.__echoPrisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__echoPrisma = prisma
}
