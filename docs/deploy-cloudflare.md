# Deploy e Operação na Cloudflare - PULSO ELEITORAL MS

A aplicação roda como um único Cloudflare Worker (`pulso-eleitoral`), gerado pelo OpenNext a partir do app Next.js. A configuração fica toda em [wrangler.jsonc](../wrangler.jsonc).

## Recursos

| Binding                               | Recurso             | Uso                                                            |
| ------------------------------------- | ------------------- | -------------------------------------------------------------- |
| `DB`                                  | D1 `pulso-db`       | banco principal                                                |
| `FOTOS`                               | R2 `pulso-fotos`    | fotos e mídia, servidas em `/fotos/...`                        |
| `KV`                                  | KV namespace        | cache                                                          |
| `ASSETS`                              | `.open-next/assets` | arquivos estáticos                                             |
| `WORKER_SELF_REFERENCE`               | o próprio Worker    | revalidação do OpenNext                                        |
| `RL_SESSAO`, `RL_ENVIO`, `RL_PUBLICO` | Rate Limiting       | 20/min por sessão, 10/min por envio, 120/min nas APIs públicas |

Domínios: `pulsoms.ia.br` e `www.pulsoms.ia.br`, como custom domains do Worker.

Cron (definido em [worker.ts](../worker.ts) e [src/server/cron.ts](../src/server/cron.ts)):

- `*/15 * * * *`: atualiza os resumos de resultados;
- `0 7 * * *` (03:00 em Campo Grande): retenção LGPD, ver [lgpd-retencao.md](lgpd-retencao.md).

## Deploy

**Automático:** o Workers Builds, ligado ao repositório no GitHub, roda `wrangler deploy` a cada push. O `build.command` do `wrangler.jsonc` gera o bundle OpenNext antes de publicar. O build usa Node 24 (npm 11), porque o npm 10 rejeita a lockfile.

**Manual** (precisa de `npx wrangler login`):

```bash
npm run deploy
```

**CI** ([.github/workflows/ci.yml](../.github/workflows/ci.yml)): lint, `tsc --noEmit` e build OpenNext em pushes e PRs para `main` e `develop`. O CI não publica.

**Rollback:** no painel, em Workers & Pages > `pulso-eleitoral` > Deployments, ou com `npx wrangler rollback`.

## Migrações do banco

Aplique **antes** de publicar código que dependa da mudança:

```bash
npm run db:generate        # após alterar src/server/db/schema.ts
npm run db:migrate:local
npm run db:migrate:remote
```

Backup e restauração: o D1 tem Time Travel (30 dias):

```bash
npx wrangler d1 time-travel info pulso-db
npx wrangler d1 time-travel restore pulso-db --timestamp <ISO-8601>
npx wrangler d1 export pulso-db --remote --output backup.sql
```

## Segredos e variáveis

Variáveis não sensíveis ficam em `vars` no `wrangler.jsonc`: `NEXT_PUBLIC_APP_URL`, `AUDIT_LOG_RETENTION_DAYS` e `PROFILE_RETENTION_DAYS`.

Segredos (`npx wrangler secret put <NOME>`):

| Nome                         | Obrigatório     | Uso                                                        |
| ---------------------------- | --------------- | ---------------------------------------------------------- |
| `EVALUATION_SESSION_SECRET`  | sim (≥ 32)      | HMAC da sessão de avaliação                                |
| `ENCRYPTION_KEY`             | sim (≥ 32)      | hashes e criptografia                                      |
| `JWT_SECRET`                 | sim (≥ 32)      | assinatura do cookie de sessão do admin                    |
| `TURNSTILE_SECRET_KEY`       | sim em produção | validação do Turnstile                                     |
| `API_TOKEN_HASH_SECRET`      | opcional        | hash dos tokens de API (padrão: `ENCRYPTION_KEY`)          |
| `RESEND_API_KEY`             | opcional        | envio de e-mail                                            |
| `PUBLIC_API_ALLOWED_ORIGINS` | opcional        | origens extras (CSV) para CORS de `/api/public/resultados` |

A chave pública do Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) entra no bundle durante o build, então precisa estar configurada como variável de build no Workers Builds.

Localmente, os mesmos nomes vão em `.dev.vars` (ver [.dev.vars.example](../.dev.vars.example)).

Trocar `ENCRYPTION_KEY` ou `API_TOKEN_HASH_SECRET` invalida os tokens de API já emitidos. Trocar `JWT_SECRET` derruba as sessões abertas do admin.

## Logs e diagnóstico

- Workers Observability (painel Cloudflare), já ativado no `wrangler.jsonc`
- `npx wrangler tail pulso-eleitoral` para logs em tempo real
- `/api/health` para o estado do banco e do escopo público
