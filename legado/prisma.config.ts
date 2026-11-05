import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'
import path from 'path'

// Carregar variáveis de .env.local e .env quando disponíveis (desenvolvimento local)
// No Vercel, as variáveis são injetadas automaticamente pelo ambiente
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL
  }
})
