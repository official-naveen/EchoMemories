import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    // `prisma generate` (run by `npm install`) does not need a real database,
    // so a placeholder is used when .env doesn't exist yet. Commands that
    // connect (migrate, seed) still need a real DATABASE_URL in .env.
    url:
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
})
