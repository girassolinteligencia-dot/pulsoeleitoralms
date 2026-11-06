# Checklist de Produção - PULSO ELEITORAL MS

Use este checklist antes de considerar a plataforma pronta para operação contínua e depois de cada deploy relevante. Detalhes de infraestrutura: [deploy-cloudflare.md](deploy-cloudflare.md).

## Ambiente (Cloudflare)

- `npx wrangler secret list` mostra `EVALUATION_SESSION_SECRET`, `ENCRYPTION_KEY`, `JWT_SECRET` e `TURNSTILE_SECRET_KEY`, todos com 32 caracteres ou mais quando exigido.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` configurada como variável de build no Workers Builds.
- `vars` do `wrangler.jsonc`: `NEXT_PUBLIC_APP_URL=https://pulsoms.ia.br` e janelas de retenção conferidas.
- Bindings ativos: D1 `pulso-db`, R2 `pulso-fotos`, KV e os três rate limits.
- Custom domains `pulsoms.ia.br` e `www.pulsoms.ia.br` ativos, com certificado válido.
- Cron Triggers `*/15 * * * *` e `0 7 * * *` listados no Worker.
- O último build do Workers Builds terminou com sucesso.

## Banco (D1)

```bash
npx wrangler d1 migrations list pulso-db --remote
```

- Nenhuma migração pendente.
- Time Travel disponível (`npx wrangler d1 time-travel info pulso-db`).
- Antes de qualquer mudança destrutiva: exporte um backup (`npx wrangler d1 export pulso-db --remote --output backup.sql`).

## Admin

- Pelo menos um usuário com papel `admin` ativo em `/admin/usuarios`.
- Login em `/admin/login` funciona, e o logout encerra a sessão.
- Usuários de teste foram desativados após a validação.

## Validação técnica

```bash
npm run lint
npx tsc --noEmit
npx opennextjs-cloudflare build
npm audit --omit=dev
```

Smokes, um de cada vez, nesta ordem:

```bash
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke:ops
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke
SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke:public
```

Os smokes esperam alguns instantes entre as chamadas. Os rate limits (`RL_PUBLICO`: 120/min, `RL_ENVIO`: 10/min) podem devolver 429 se a pausa for curta demais. Nesse caso, aumente `SMOKE_DELAY_MS` (ex.: `2500`).

## Observabilidade

```bash
curl https://pulsoms.ia.br/api/health
```

- `status` = `ok`.
- `checks.database`, `checks.activeCampaigns`, `checks.publicCandidates` e `checks.cepsMs` = `ok`.
- Workers Observability sem erros novos depois do deploy (`npx wrangler tail pulso-eleitoral`).
- Logs do Cron mostram `[cron] resumos atualizados` a cada 15 min e `[cron] retenção LGPD` uma vez por dia.

## Auditoria

- `/admin/auditoria` mostra eventos recentes: rodadas, exportações, dossiês, moderação e alterações administrativas.

## LGPD e transparência

- Revisar `/privacidade` e `/termos`.
- Confirmar o texto do fluxo público sobre o uso do CEP.
- Confirmar que a manifestação não guarda o CEP completo.
- Confirmar que a comunicação diferencia percepção espontânea de pesquisa eleitoral registrada.
- Revisar [lgpd-retencao.md](lgpd-retencao.md) com o responsável jurídico ou operacional.

## Produto

- `/avaliar` funciona em desktop e mobile, com o Turnstile passando de forma invisível.
- Fazer uma avaliação completa de teste.
- `/api/candidatos` devolve candidatos ativos, com fotos carregando de `/fotos/...`.
- `/api/configuracoes/public` responde.
- Painel admin: Dashboard, Metodologia, Relatórios, Auditoria, Moderação, Sistema e Usuários abrem sem erro.

## Pós-deploy

- Encerrar as sessões usadas nos testes.
- Revogar tokens de API de teste em `/admin/api-tokens`.
- Registrar a versão e a data do deploy no relatório operacional.
