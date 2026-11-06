# PULSO ELEITORAL MS

Plataforma de inteligência eleitoral e percepção pública para Mato Grosso do Sul.

Produção: <https://pulsoms.ia.br>

## Stack

- Next.js 16 / React 19 / App Router, publicado com OpenNext (`@opennextjs/cloudflare`)
- TypeScript, Tailwind CSS 3
- Cloudflare Workers, com:
  - **D1** (`pulso-db`): banco SQLite, schema e migrações via Drizzle
  - **R2** (`pulso-fotos`): fotos de candidatos, órgãos, serviços e identidade visual
  - **KV**: cache
  - **Rate Limiting** (`RL_SESSAO`, `RL_ENVIO`, `RL_PUBLICO`)
  - **Cron Triggers**: resumos a cada 15 min e retenção LGPD diária
  - **Turnstile**: proteção invisível no envio de avaliações
- Deploy automático pelo Workers Builds a cada push

Configuração em [wrangler.jsonc](wrangler.jsonc). Deploy e operação: [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md).

## Setup local

```bash
npm install
cp .dev.vars.example .dev.vars   # preencha os segredos
npm run db:migrate:local         # cria o D1 local
npm run dev                      # Next.js em modo dev (bindings via OpenNext)
npm run preview                  # build OpenNext + wrangler dev (mais próximo da produção)
```

Variáveis e segredos: ver [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md#segredos-e-variáveis).

## Banco (D1 + Drizzle)

- Schema: [src/server/db/schema.ts](src/server/db/schema.ts)
- Migrações: [drizzle/migrations](drizzle/migrations)

```bash
npm run db:generate        # gera migração a partir do schema
npm run db:migrate:local   # aplica no D1 local
npm run db:migrate:remote  # aplica no D1 de produção
```

Limites do D1 a lembrar: até 100 parâmetros por instrução e ~100 KB por instrução SQL.

## Admin

Painel em `/admin/login`. Login próprio por e-mail e senha (hash PBKDF2 no D1, sessão em cookie HttpOnly assinado de 12 h).

Papéis (`admin_users`): `admin`, `editor` e `viewer`.

```bash
npm run admin:senha -- email@dominio.com   # cria ou redefine a senha de um admin no D1 remoto
```

Guia: [docs/acesso-admin.md](docs/acesso-admin.md)

## Dados

- Candidaturas e fotos do TSE: [docs/tse-importacao.md](docs/tse-importacao.md) (`npm run tse:importar`)
- Fotos e mídia no R2: [docs/assets-candidatos.md](docs/assets-candidatos.md)
- CEPs de MS (IBGE): `npm run ceps:import:ibge -- <arquivo.parquet> --remote` (use `--dry-run` antes)

## Metodologia e LGPD

A plataforma separa percepção pública espontânea de pesquisa registrável.

- [docs/metodologia-pulso-eleitoral-ms.md](docs/metodologia-pulso-eleitoral-ms.md)
- [docs/lgpd-retencao.md](docs/lgpd-retencao.md): retenção automática pelo Cron

Eventos administrativos ficam em `audit_logs`, consultáveis em `/admin/auditoria`.

## Observabilidade

- Healthcheck público: `/api/health` (banco, campanhas ativas e candidatos no escopo público, sem expor dados sensíveis)
- Logs: Workers Observability no painel Cloudflare, ou `npx wrangler tail`

## Validação

Antes de publicar:

```bash
npm run lint
npx opennextjs-cloudflare build
npm audit --omit=dev
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke:ops
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke:public
```

Checklist: [docs/checklist-producao.md](docs/checklist-producao.md)

---

© 2026 PULSO ELEITORAL MS. Responsável técnico: Paulo Fernando Garcia Cardoso.
