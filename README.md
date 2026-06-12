# PULSO ELEITORAL MS

Plataforma de inteligência eleitoral e percepção pública para Mato Grosso do Sul.

## Stack

- Next.js 16 / React 19 / App Router
- TypeScript
- Tailwind CSS 3
- Prisma 6
- Supabase Postgres, Auth e RLS
- Vercel

## Setup Local

1. Instale dependências:

```bash
npm install
```

2. Configure `.env.local` com base em `.env.example`.

Variáveis mínimas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=
EVALUATION_SESSION_SECRET=
ENCRYPTION_KEY=
```

3. Gere o Prisma Client:

```bash
npx prisma generate
```

4. Rode em desenvolvimento:

```bash
npm run dev
```

## Banco e RLS

O projeto usa migrações Prisma versionadas. Não use `prisma db push` no banco real.

Comandos operacionais:

```bash
npm run db:status
npm run db:deploy
npm run db:rls:apply
npm run db:preflight
```

Runbook: [docs/banco-real-rls-runbook.md](docs/banco-real-rls-runbook.md)

## Admin

O painel admin fica em:

```text
/admin/login
```

O login principal usa Supabase Auth com e-mail e senha. Magic link permanece disponível como alternativa.

Guia: [docs/acesso-admin.md](docs/acesso-admin.md)

## Metodologia

A plataforma separa:

- percepção pública espontânea;
- pesquisa registrável.

Guia metodológico: [docs/metodologia-pulso-eleitoral-ms.md](docs/metodologia-pulso-eleitoral-ms.md)

## Auditoria

Eventos administrativos são registrados em `audit_logs` e podem ser consultados em:

```text
/admin/auditoria
```

Retenção em modo dry-run:

```bash
npm run audit:retention
```

Aplicar retenção:

```bash
npm run audit:retention:apply
```

## Observabilidade

Healthcheck público e seguro:

```text
/api/health
```

Ele valida conexão com banco, campanhas ativas e candidatos disponíveis no escopo público sem expor credenciais ou dados sensíveis.

## Validação

Execute antes de deploy:

```bash
npx prisma validate
npm run lint
npm run build
npm audit --omit=dev
npm run smoke
npm run smoke:public
npm run smoke:security
```

Smoke autenticado real:

```bash
ADMIN_SMOKE_TOKEN=ey... npm run smoke:admin
```

Checklist final: [docs/checklist-producao.md](docs/checklist-producao.md)

## Relatórios Técnicos

- [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md)
- [docs/checklist-producao.md](docs/checklist-producao.md)

---

© 2026 PULSO ELEITORAL MS. Responsável técnico: Paulo Fernando Garcia Cardoso.
