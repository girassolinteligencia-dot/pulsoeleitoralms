import { defineConfig } from "drizzle-kit";

// Gera migrations SQL para o D1. Aplicação: npm run db:migrate:local | db:migrate:remote
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle/migrations",
});
