# PulsoEleitoral MS-2026

Plataforma oficial de inteligência e percepção pública para o ciclo eleitoral de 2026 em Mato Grosso do Sul.
Desenvolvido por **Girassol Inteligência** (Paulo Fernando Garcia Cardoso).

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router) / React 18+
- **Linguagem**: TypeScript (Strict Mode)
- **Visual**: Tailwind CSS v4 / Framer Motion / GSAP (Plasma Fragments)
- **Tipografia**: Poppins (Display) & Lora (Body)
- **Backend**: Next.js API Routes / Prisma ORM
- **Infraestrutura**: Supabase (PostgreSQL + RLS) / Vercel
- **Auditoria**: Sistema Anti-robô (Fingerprint, Honeypot, Timing Analysis)

## 📦 Estrutura de Pastas

- `src/app/(public)`: Fluxo de avaliação para o cidadão.
- `src/app/(admin)`: Painel de inteligência e moderação (Restrito).
- `src/components/fragmento`: Sistema de física de plasma (5 camadas).
- `src/components/etapas`: Workflow modular da experiência de usuário.
- `prisma/`: Definições de schema e migrações de auditoria.

## 🛠️ Setup de Desenvolvimento

1. **Configuração do Ambiente**:
   Certifique-se de ter o arquivo `.env` configurado com a `DATABASE_URL` utilizando o Pooler (porta 6543) para migrações Prisma estáveis.

2. **Migrações e Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Início Rápido**:
   ```bash
   npm install
   npm run dev
   ```

## 🛡️ Auditoria e Segurança

A plataforma utiliza um sistema de física orgânica (Fragmentos) e monitoramento de comportamento para mitigar ataques de bots e manipulação de massa. Cada pulso é validado através de:
- **Hash de Identidade**: Fingerprint único por dispositivo.
- **Análise Temporal**: Bloqueio de submissões com tempo de interação suspeito.
- **RLS**: Row Level Security em nível de banco de dados para todas as tabelas.

---

© 2026 **Girassol Inteligência** • *Tecnologia a serviço da transparência eleitoral.*
Responsável Técnico: Paulo Fernando Garcia Cardoso

