# Auditoria Tecnica - PULSO ELEITORAL MS

Data da auditoria: 2026-05-18  
Workspace: `C:\.PULSOELEITORAL`  
Escopo: estrutura, stack, build, lint, dependencias, seguranca, banco, APIs, fluxo publico, admin, CI e prontidao para finalizar no VS Code.

## Atualizacao de execucao - 2026-05-18

Correcoes executadas nesta rodada:

- Plataforma renomeada para **PULSO ELEITORAL MS** nas telas principais, metadata, README, seed e comentarios de identidade visual.
- Bypass `GI2026` removido do login admin.
- `admin_bypass` via `localStorage` removido do layout/dashboard admin.
- Todas as rotas `/api/admin/**` passaram a exigir `Authorization: Bearer <supabase_access_token>` com validacao server-side.
- Fetches do painel admin passaram a enviar token Supabase pelo helper `adminFetch`.
- Export administrativo agora exige auth e remove `IP_Hash`/`Fingerprint_Hash` do CSV padrao.
- `next` e `eslint-config-next` atualizados para `16.2.6`.
- `ws` corrigido via `npm audit fix`.
- `postcss` vulneravel interno foi resolvido com override global para `^8.5.12`.
- `npm audit --omit=dev` agora retorna zero vulnerabilidades.
- `npm run lint` agora passa sem warnings.
- `npm run build` passa em producao com Next `16.2.6`.
- `/api/candidatos` agora retorna payload reduzido e trata cidade/bairro como dados do respondente, nao como restricao de candidato.
- `/api/configuracoes/public` agora filtra apenas chaves publicas por prefixo.
- `/api/avaliar` agora valida payload, atributos duplicados, candidato ativo, atributos permitidos da campanha e limite simples de 10 manifestacoes por minuto por IP/fingerprint.

Smoke test final em `next start -p 3010`:

| Rota | Status esperado | Resultado |
| --- | ---: | ---: |
| `/` | 200 | 200 |
| `/avaliar` | 200 | 200 |
| `/admin/login` | 200 | 200 |
| `/api/candidatos` | 200 | 200 |
| `/api/configuracoes/public` | 200 | 200 |
| `/api/admin/stats` sem token | 401 | 401 |
| `/api/admin/export` sem token | 401 | 401 |
| `/api/avaliar` com payload invalido | 400 | 400 |

Pendencias que continuam recomendadas:

- Criar migracoes Prisma formais, em vez de depender de SQL manual e `db push`.
- Revisar RLS real no Supabase, incluindo `manifestacoes` e `parametros_plataforma`.
- Evoluir anti-fraude para nonce/timestamp server-side por sessao, pois o frontend ainda inicia parte do contexto de tempo/fingerprint.
- Criar modulo metodologico separado para diferenciar "percepcao espontanea" de "pesquisa eleitoral registravel".
- Adicionar testes automatizados para APIs admin, `/api/avaliar` e fluxo publico.

## Atualizacao de sprint - 2026-05-18

Correcoes e evolucoes executadas no sprint seguinte:

- Criada migração baseline versionada em `prisma/migrations/20260519000000_initial_baseline/migration.sql`.
- Criado script de endurecimento RLS em `prisma/hardening_rls.sql`, incluindo `manifestacoes` e `parametros_plataforma`.
- Adicionada sessão assinada server-side para avaliação em `/api/avaliar/session`.
- `/api/avaliar` deixou de confiar em `startTime/endTime` do cliente e passou a validar `sessionToken` HMAC com timestamp emitido no servidor.
- Frontend público passou a solicitar sessão ao selecionar candidato e enviar `sessionToken` no POST final.
- Adicionado smoke test automatizável em `scripts/smoke-http.mjs` e script `npm run smoke`.
- Adicionado documento metodológico em `docs/metodologia-pulso-eleitoral-ms.md`, separando percepção espontânea de pesquisa registrável.
- `.env.example` recebeu `EVALUATION_SESSION_SECRET`.

Validações do sprint:

```bash
npm run lint          # passou
npm run build         # passou
npm audit --omit=dev  # 0 vulnerabilidades
npx prisma validate   # passou
npm run smoke         # passou com servidor local em http://localhost:3010
```

Smoke test automatizado:

- `/` -> 200
- `/avaliar` -> 200
- `/admin/login` -> 200
- `/api/candidatos` -> 200
- `/api/configuracoes/public` -> 200
- `/api/admin/stats` sem token -> 401
- `/api/admin/export` sem token -> 401
- `/api/avaliar` com payload inválido -> 400
- `/api/avaliar/session` com payload inválido -> 400

Pendências que ficam para um sprint posterior:

- Aplicar `prisma/hardening_rls.sql` no Supabase apenas após backup e conferência de drift.
- Resolver migração de banco real com `prisma migrate resolve`/baseline, sem recriar tabelas existentes.
- Criar testes autenticados usando um token Supabase de staging.
- Implementar módulo de rodadas metodológicas no banco e no admin.

## Atualizacao de sprint - 2026-05-19

Correcoes e evolucoes executadas no sprint de metodologia:

- Adicionado modelo `RodadaMetodologica` ao Prisma, relacionado opcionalmente a `Campanha`.
- Criada migração incremental `20260519010000_add_rodadas_metodologicas` e baseline atualizado para incluir a tabela `rodadas_metodologicas`.
- Script `prisma/hardening_rls.sql` atualizado para habilitar RLS em `rodadas_metodologicas` e permitir leitura pública apenas de rodadas `ativa`.
- Criada API protegida `/api/admin/rodadas` para listar, criar e atualizar rodadas metodológicas.
- Criada tela admin `/admin/metodologia` com filtros, cadastro e edição de rodadas.
- Navegação admin passou a exibir a área "Metodologia".
- Smoke test passou a verificar `/admin/metodologia` e `/api/admin/rodadas` sem token.

Observação operacional:

- As migrações e políticas RLS foram versionadas no repositório, mas ainda não foram aplicadas ao banco Supabase real nesta execução.

Validações do sprint:

```bash
npx prisma validate   # passou
npm run lint          # passou
npm run build         # passou
npm audit --omit=dev  # 0 vulnerabilidades
npm run smoke         # passou com servidor local em http://localhost:3010
```

Smoke test automatizado:

- `/` -> 200
- `/avaliar` -> 200
- `/admin/login` -> 200
- `/admin/metodologia` -> 200
- `/api/candidatos` -> 200
- `/api/configuracoes/public` -> 200
- `/api/admin/stats` sem token -> 401
- `/api/admin/export` sem token -> 401
- `/api/admin/rodadas` sem token -> 401
- `/api/avaliar` com payload inválido -> 400
- `/api/avaliar/session` com payload inválido -> 400

Pendências que ficam para o próximo sprint:

- Aplicar a migração `20260519010000_add_rodadas_metodologicas` no banco real ou resolver baseline com `prisma migrate resolve`, após backup e conferência de drift.
- Aplicar e testar `prisma/hardening_rls.sql` no Supabase.
- Criar testes autenticados para CRUD de rodadas com token Supabase de staging.
- Conectar rodadas metodológicas aos relatórios e exportações metodológicas.

## Atualizacao de sprint - 2026-05-19 - Relatórios metodológicos

Correcoes e evolucoes executadas:

- Criado helper compartilhado `resolveRodadaScope` para aplicar o mesmo escopo em relatórios e exportações.
- `/api/admin/relatorios` passou a aceitar `rodadaId`, filtrando por campanha, período de campo e registros válidos.
- `/api/admin/export` passou a aceitar `rodadaId` ou `dias`, preservando CSV sem hashes sensíveis e com metadados de rodada/período.
- Tela `/admin/relatorios` recebeu seletor de rodada metodológica.
- O hub de relatórios passou a exibir aviso metodológico conforme o escopo selecionado.
- Exportação CSV na tela de relatórios passou a usar download autenticado com o mesmo filtro visual.
- Smoke test passou a verificar `/api/admin/relatorios` sem token.

Pendências para o próximo sprint:

- Criar testes autenticados de API para validar filtro por `rodadaId` com dados controlados.
- Evoluir exportação metodológica para dossiê estruturado, com questionário, plano amostral e ponderação.
- Aplicar as migrações/RLS no Supabase real após conferência de drift.

## Atualizacao de sprint - 2026-05-19 - Dossiê metodológico

Correcoes e evolucoes executadas:

- Criada rota protegida `/api/admin/rodadas/[id]/dossie`.
- O dossiê JSON reúne identificação da rodada, escopo operacional, indicadores de qualidade, atributos mais frequentes, metodologia declarada e enquadramento de comunicação.
- Tela `/admin/metodologia` recebeu ação para baixar dossiê por rodada.
- Helper `downloadAdminFile` foi criado para permitir downloads administrativos além de CSV.
- Smoke test passou a verificar a proteção da rota dinâmica de dossiê sem token.

Pendências para o próximo sprint:

- Criar visualização HTML/PDF do dossiê, com assinatura/versão do artefato.
- Adicionar trilha de auditoria para geração de dossiês.
- Testar dossiê com dados reais após aplicação da migração no Supabase.

Validações consolidadas após os sprints de relatórios e dossiê:

```bash
npx prisma validate   # passou
npm run lint          # passou
npm run build         # passou
npm audit --omit=dev  # 0 vulnerabilidades
npm run smoke         # passou com servidor local em http://localhost:3010
```

Smoke test automatizado atualizado:

- `/` -> 200
- `/avaliar` -> 200
- `/admin/login` -> 200
- `/admin/metodologia` -> 200
- `/api/candidatos` -> 200
- `/api/configuracoes/public` -> 200
- `/api/admin/stats` sem token -> 401
- `/api/admin/export` sem token -> 401
- `/api/admin/relatorios` sem token -> 401
- `/api/admin/rodadas` sem token -> 401
- `/api/admin/rodadas/smoke/dossie` sem token -> 401
- `/api/avaliar` com payload inválido -> 400
- `/api/avaliar/session` com payload inválido -> 400

## Atualizacao de sprint - 2026-05-19 - Banco real e RLS

Correcoes e evolucoes executadas:

- Criado `scripts/db-preflight.mjs` para auditar conexão, tabelas esperadas, estado de RLS, policies e histórico Prisma.
- Adicionados scripts operacionais:
  - `npm run db:preflight`
  - `npm run db:status`
  - `npm run db:deploy`
  - `npm run db:rls:apply`
- Criado runbook operacional em `docs/banco-real-rls-runbook.md`.
- `prisma/hardening_rls.sql` foi endurecido para restringir `manifestacoes`, `avaliacoes`, `bloqueios` e `audit_logs` ao `service_role`.
- Preflight inicial confirmou conexão ao Supabase real e identificou:
  - tabelas principais existentes;
  - ausência de `rodadas_metodologicas`;
  - RLS desabilitado nas tabelas esperadas;
  - `_prisma_migrations` ausente/vazio.
- `prisma migrate diff` confirmou que o único drift relevante era a ausência de `rodadas_metodologicas`.
- Baseline `20260519000000_initial_baseline` foi marcado como aplicado no banco real.
- Migração `20260519010000_add_rodadas_metodologicas` foi aplicada com sucesso no banco real.

Ponto pendente:

- Resolvido em 2026-05-19: `prisma/hardening_rls.sql` foi aplicado com sucesso no banco real.

Validações finais do sprint:

```bash
npm run db:preflight   # passou; RLS habilitado nas 10 tabelas esperadas
npm run db:status      # passou; schema do banco em dia
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou com servidor local em http://localhost:3010
```

Estado confirmado no Supabase real:

- Migrações aplicadas:
  - `20260519000000_initial_baseline`
  - `20260519010000_add_rodadas_metodologicas`
- RLS habilitado:
  - `campanhas`
  - `atributos`
  - `campanha_atributos`
  - `candidatos`
  - `manifestacoes`
  - `avaliacoes`
  - `bloqueios`
  - `audit_logs`
  - `parametros_plataforma`
  - `rodadas_metodologicas`
- Policies criadas para leitura pública controlada de catálogo e restrição de tabelas sensíveis ao `service_role`.

Pendências para o próximo sprint:

- Criar testes autenticados com usuário admin real/staging.
- Criar teste de acesso direto via anon key para confirmar que `manifestacoes`, `avaliacoes`, `bloqueios` e `audit_logs` não vazam pelo cliente Supabase.
- Registrar eventos administrativos críticos em `AuditLog`.

## Atualizacao de sprint - 2026-05-19 - Testes de segurança pós-RLS

Correcoes e evolucoes executadas:

- Criado `scripts/security-smoke.mjs`.
- Adicionado script `npm run smoke:security`.
- `.env.example` passou a documentar `ADMIN_SMOKE_TOKEN` opcional para testes autenticados.
- `docs/banco-real-rls-runbook.md` atualizado com a etapa de smoke de segurança.

Resultados do smoke de segurança:

- `manifestacoes` via anon key: bloqueado (`401`).
- `avaliacoes` via anon key: bloqueado (`401`).
- `bloqueios` via anon key: bloqueado (`401`).
- `audit_logs` via anon key: bloqueado (`401`).
- Rotas admin autenticadas foram puladas porque `ADMIN_SMOKE_TOKEN` não está configurado.

Aviso observado:

- O REST direto do Supabase retornou `401` também para tabelas de catálogo público (`campanhas`, `atributos`, `campanha_atributos`, `candidatos`, `parametros_plataforma`, `rodadas_metodologicas`). Isso não quebra a aplicação atual, pois o frontend consome APIs Next/Prisma, mas indica que a anon key/configuração REST deve ser revisada se houver intenção de uso direto do cliente Supabase para catálogo.

Validações finais do sprint:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:security # passou com 3 checks autenticados pulados e 6 avisos de catálogo REST
```

Pendências para o próximo sprint:

- Gerar `ADMIN_SMOKE_TOKEN` de staging e validar rotas admin autenticadas.
- Investigar o `401` do REST direto para catálogo público ou documentar oficialmente que o cliente não usa PostgREST direto.
- Adicionar gravação em `AuditLog` para geração de dossiê, exportações e mudanças administrativas.

## Atualizacao de sprint - 2026-05-19 - AuditLog operacional

Correcoes e evolucoes executadas:

- `src/lib/adminAuth.ts` passou a expor `getAdminIdentity`, mantendo `requireAdmin` compatível com as rotas existentes.
- Criado helper server-side `src/lib/auditLog.ts` para gravação resiliente em `audit_logs`.
- Eventos auditados:
  - `RODADA_CRIADA`
  - `RODADA_ATUALIZADA`
  - `EXPORT_CSV_GERADO`
  - `DOSSIE_GERADO`
  - `AVALIACAO_VALIDADA`
  - `AVALIACAO_INVALIDADA`
- Criada rota protegida `/api/admin/audit-logs`.
- Criada tela admin `/admin/auditoria`.
- Navegação admin passou a exibir "Auditoria".
- Smoke HTTP passou a verificar `/admin/auditoria` e `/api/admin/audit-logs` sem token.
- Smoke de segurança passou a incluir `/api/admin/audit-logs` nos checks autenticados opcionais.

Validações finais do sprint:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:security # passou com 4 checks autenticados pulados e 6 avisos de catálogo REST
```

Pendências para o próximo sprint:

- Gerar `ADMIN_SMOKE_TOKEN` de staging e validar leitura real de `/api/admin/audit-logs`.
- Ampliar AuditLog para CRUD de campanhas, candidatos, atributos, configurações e bloqueios.
- Considerar retenção/arquivamento de `audit_logs` quando o volume crescer.

## Atualizacao de sprint - 2026-05-19 - AuditLog ampliado

Correcoes e evolucoes executadas:

- AuditLog ampliado para as demais mutações administrativas centrais.
- Novos eventos auditados:
  - `CAMPANHA_CRIADA`
  - `CAMPANHA_ATUALIZADA`
  - `CANDIDATO_CRIADO`
  - `CANDIDATO_ATUALIZADO`
  - `ATRIBUTO_CRIADO`
  - `ATRIBUTO_ATUALIZADO`
  - `PARAMETRO_SALVO`
  - `BLOQUEIO_CRIADO`
  - `BLOQUEIO_REMOVIDO`
- Logs de configurações registram chave/grupo/descrição, sem persistir o valor completo no detalhe de auditoria.
- Logs de bloqueios registram motivo/expiração e evitam expor hash diretamente no detalhe.

Pendências para o próximo sprint:

- Validar fluxos autenticados reais com `ADMIN_SMOKE_TOKEN`.
- Criar retenção/arquivamento de `audit_logs`.
- Adicionar filtros por período e busca textual na tela `/admin/auditoria`.

## Atualizacao de sprint - 2026-05-19 - Auditoria operacional

Correcoes e evolucoes executadas:

- `/api/admin/audit-logs` passou a aceitar:
  - `search`
  - `inicio`
  - `fim`
  - `page`
  - `limit`
  - `acao`
  - `entidade`
- A API passou a devolver listas de ações e entidades disponíveis para filtros.
- Tela `/admin/auditoria` recebeu:
  - busca textual;
  - filtros por ação e entidade;
  - filtros por período;
  - paginação anterior/próxima;
  - botão para limpar filtros.
- Adicionados índices ao modelo `AuditLog`:
  - `criado_em`
  - `acao, criado_em`
  - `entidade, criado_em`
- Criada e aplicada no banco real a migração `20260519120000_add_audit_log_indexes`.

Validações finais do sprint:

```bash
npm run db:status      # passou; 3 migrações aplicadas
npm run db:preflight   # passou; RLS habilitado nas 10 tabelas esperadas
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:security # passou com 4 checks autenticados pulados e 6 avisos de catálogo REST
```

Pendências para o próximo sprint:

- Criar retenção/arquivamento de `audit_logs`.
- Validar rotas autenticadas reais com `ADMIN_SMOKE_TOKEN`.
- Investigar/configurar o acesso REST de catálogo público via anon key, caso a arquitetura passe a depender de PostgREST direto.

## Atualizacao de sprint - 2026-05-19 - Smoke autenticado real

Correcoes e evolucoes executadas:

- `scripts/security-smoke.mjs` passou a aceitar modo obrigatório de autenticação admin via `--require-admin`.
- Adicionado script `npm run smoke:admin`.
- `npm run smoke:security` continua permitindo checks autenticados opcionais.
- `npm run smoke:admin` falha explicitamente se `ADMIN_SMOKE_TOKEN` não estiver configurado, evitando falso positivo.
- `docs/banco-real-rls-runbook.md` e `.env.example` foram atualizados com a diferença entre `smoke:security` e `smoke:admin`.

Resultado do sprint:

- `npm run smoke:admin` foi executado e falhou corretamente porque `ADMIN_SMOKE_TOKEN` não está definido em `.env.local`/`.env`.
- A validação autenticada real ainda depende de um access token Supabase de usuário permitido em `ADMIN_EMAILS`.

Validações executadas:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:security # passou com 4 checks autenticados pulados e 6 avisos de catálogo REST
npm run smoke:admin    # falhou por ausência esperada de ADMIN_SMOKE_TOKEN
```

Como concluir este sprint operacionalmente:

```bash
# PowerShell
$env:ADMIN_SMOKE_TOKEN="TOKEN_SUPABASE_DE_ADMIN_PERMITIDO"
npm run smoke:admin
```

Pendência:

- Obter token Supabase real/staging de usuário listado em `ADMIN_EMAILS` e reexecutar `npm run smoke:admin`.

Reexecução com token informado pelo operador:

- `npm run smoke:admin` foi reexecutado em 2026-05-19 com servidor local em `http://localhost:3010`.
- Checks RLS via anon key continuaram bloqueando tabelas sensíveis (`manifestacoes`, `avaliacoes`, `bloqueios`, `audit_logs`).
- As rotas admin autenticadas retornaram `401`:
  - `/api/admin/stats`
  - `/api/admin/rodadas`
  - `/api/admin/relatorios`
  - `/api/admin/audit-logs`
- Interpretação técnica: o valor informado não foi aceito por `supabase.auth.getUser()` como access token Supabase válido. Para este smoke, é necessário usar o JWT/access token de sessão de um usuário cujo e-mail esteja listado em `ADMIN_EMAILS`.

Reexecução final com access token Supabase válido:

- `npm run smoke:admin` foi executado em 2026-05-19 com servidor local em `http://localhost:3010`.
- Checks RLS via anon key continuaram bloqueando tabelas sensíveis (`manifestacoes`, `avaliacoes`, `bloqueios`, `audit_logs`).
- Rotas admin autenticadas passaram:
  - `/api/admin/stats` -> 200
  - `/api/admin/rodadas` -> 200
  - `/api/admin/relatorios` -> 200
  - `/api/admin/audit-logs` -> 200
- Resultado: smoke autenticado real concluído com sucesso.

## Atualizacao de sprint - 2026-05-19 - Retenção e fechamento operacional

Correcoes e evolucoes executadas:

- Criado `scripts/audit-retention.mjs` para retenção de `audit_logs`.
- Adicionados scripts:
  - `npm run audit:retention`
  - `npm run audit:retention:apply`
- Retenção roda em dry-run por padrão e exige `--apply` para apagar dados.
- Janela padrão de retenção: 365 dias via `AUDIT_LOG_RETENTION_DAYS`.
- `.env.example` recebeu `AUDIT_LOG_RETENTION_DAYS=365`.
- Criado `docs/checklist-producao.md`.
- README foi reescrito para refletir o estado real da plataforma:
  - Next 16/React 19;
  - Prisma migrations em vez de `db push`;
  - RLS;
  - admin por senha/magic link;
  - smokes;
  - runbooks.

Validações finais do fechamento:

```bash
npm run audit:retention # passou em dry-run; 0 logs expirados
npm run db:status       # passou; banco em dia
npx prisma validate     # passou
npm run lint            # passou
npm run build           # passou
npm audit --omit=dev    # 0 vulnerabilidades
npm run smoke           # passou
npm run smoke:security  # passou com 4 checks autenticados pulados e 6 avisos de catálogo REST
```

Estado final recomendado:

- Plataforma pronta para continuidade no VS Code.
- Banco real versionado por migrações Prisma.
- RLS aplicado e validado.
- Admin protegido server-side.
- AuditLog operacional disponível.
- Metodologia/rodadas/dossiê disponíveis no admin.
- Próxima ação antes de produção pública: seguir `docs/checklist-producao.md` e configurar variáveis no Vercel.

## Atualizacao de deploy - 2026-05-19

Tentativa de deploy final:

- Projeto local possui `.vercel/project.json`.
- Vercel CLI foi executada via `npx vercel`.
- `npx vercel deploy --prod --yes` falhou porque a CLI não conseguiu recuperar as configurações do projeto linkado.
- `npx vercel whoami` retornou `Not authorized`.
- Diagnóstico: a máquina/sessão atual não está autenticada na Vercel ou não possui acesso ao time/projeto linkado.

Arquivo criado:

- `docs/deploy-vercel.md`

Comando a executar após login/token Vercel:

```bash
npx vercel deploy --prod --yes
```

Ou com token:

```powershell
$env:VERCEL_TOKEN="SEU_TOKEN_VERCEL"
npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
Remove-Item Env:VERCEL_TOKEN
```

## 1. Resumo executivo

A plataforma esta em um estado intermediario: **compila em producao**, mas **nao deve ser publicada ou usada em ambiente publico antes de corrigir seguranca admin, dependencias vulneraveis e lint/CI**.

Pontos positivos:

- `npm run build` passou com Next.js `16.2.4`, React `19.2.4` e Prisma `6.19.3`.
- `npx prisma validate` confirmou que o `prisma/schema.prisma` e valido.
- Smoke test HTTP em producao local retornou `200` para `/`, `/avaliar`, `/admin/login`, `/api/candidatos`, `/api/configuracoes/public`, `/api/admin/stats` e `/api/admin/export`.
- `.env` e `.env.local` nao estao versionados, e `.gitignore` ignora `.env*`.
- A estrutura App Router esta coerente com a documentacao local do Next 16 em `node_modules/next/dist/docs`.

Bloqueadores:

- **Critico:** APIs admin nao possuem autorizacao server-side. O layout admin protege apenas no cliente.
- **Critico:** existe bypass hardcoded `GI2026` que seta `admin_bypass` no `localStorage`.
- **Critico:** `/api/admin/export` respondeu `200` sem sessao e expõe CSV com `IP_Hash` e `Fingerprint_Hash`.
- **Alto:** `npm audit --omit=dev` reportou vulnerabilidade alta em `next@16.2.4`; correcao sugerida para `next@16.2.6`.
- **Alto:** `npm run lint` falha com 40 erros e 8 warnings; CI atual roda lint, logo PR/deploy confiavel deve falhar.
- **Alto:** anti-fraude atual aceita `fingerprint`, `startTime` e `endTime` vindos do cliente, facilmente manipulaveis.
- **Medio:** README esta desatualizado: fala em Next 14/React 18/Tailwind v4, mas o projeto usa Next 16/React 19/Tailwind 3.
- **Medio:** nao ha pasta `prisma/migrations`; o banco depende de SQL manual e `db push`, aumentando risco de drift.

## 2. Verificacoes executadas

### Build

Comando:

```bash
npm run build
```

Resultado: **passou**.

Resumo:

- `prisma generate` executou com sucesso.
- `next build` compilou com Turbopack.
- TypeScript passou.
- 27 paginas estaticas geradas.
- Rotas API foram marcadas como dinamicas.

### Lint

Comando:

```bash
npm run lint
```

Resultado: **falhou**.

Resumo:

- 48 problemas no total: 40 erros e 8 warnings.
- Erros principais:
  - `no-explicit-any` em paginas, componentes e APIs.
  - scripts JS antigos com `require()` sendo analisados pelo ESLint.
  - regra React `react-hooks/set-state-in-effect` em paginas admin.
  - uso de `<img>` em componente de etapa onde `next/image` seria preferivel.

### Prisma

Comando:

```bash
npx prisma validate
```

Resultado: **passou**.

Observacao: Prisma indicou update major disponivel `6.19.3 -> 7.8.0`, mas isso nao deve ser feito junto da correcao emergencial sem uma etapa propria de migracao.

### Dependencias

Comando:

```bash
npm audit --omit=dev
```

Resultado: **falhou**.

Achados:

- `next` com severidade alta.
- `postcss` moderado via dependencia de `next`.
- `ws` moderado.
- `npm audit fix` resolve `ws`.
- Para Next, o audit sugere `next@16.2.6` via `npm audit fix --force`.

### Smoke test HTTP local

Foi iniciado `next start -p 3010` a partir do build existente e consultadas rotas-chave.

Resultado:

| Rota | Status | Observacao |
| --- | ---: | --- |
| `/` | 200 | Home renderiza |
| `/avaliar` | 200 | Fluxo publico renderiza |
| `/admin/login` | 200 | Login admin renderiza |
| `/api/candidatos` | 200 | Retorna JSON grande, cerca de 465 KB |
| `/api/configuracoes/public` | 200 | Retorna parametros publicos |
| `/api/admin/stats` | 200 | Sem autenticacao server-side |
| `/api/admin/export` | 200 | Sem autenticacao server-side, retorna CSV |

## 3. Stack e estrutura

Stack real no `package.json`:

- Next.js `16.2.4`
- React `19.2.4`
- Prisma `6.19.3`
- Supabase JS/SSR
- Tailwind `3.4.19`
- Framer Motion, GSAP, Recharts, Lucide

Arquivos TS/TSX em `src`: 60.

Volume de ativos em `public/candidatos`: 17.198 arquivos.

Isso explica a configuracao `.vscode/settings.json` com `git.ignoreLimitWarning`, mas tambem sinaliza que o projeto precisa de uma estrategia de assets: storage externo, otimizacao e/ou limpeza de imagens locais.

## 4. Achados por severidade

### Critico - Admin protegido apenas no cliente

Evidencias:

- `src/app/(admin)/admin/layout.tsx` faz `supabase.auth.getSession()` no cliente.
- `src/app/(admin)/admin/layout.tsx` aceita `localStorage.getItem('admin_bypass') === 'true'`.
- Todas as APIs em `src/app/api/admin/**/route.ts` executam consultas/mutacoes diretamente com Prisma, sem middleware/guard server-side.

Impacto:

Qualquer pessoa com acesso a URL das APIs pode ler dados administrativos, exportar dados e potencialmente criar/alterar campanhas, candidatos, atributos, configuracoes, bloqueios e moderacao.

Correcao recomendada:

1. Remover bypass hardcoded.
2. Criar helper server-side `requireAdmin(req)` para validar JWT Supabase no servidor.
3. Aplicar o helper em todas as rotas `/api/admin/**`.
4. Retornar `401` quando nao houver sessao e `403` quando o usuario nao for permitido.
5. Centralizar lista de admins em variavel de ambiente ou tabela, nao hardcoded no client.

### Critico - Bypass hardcoded `GI2026`

Evidencias:

- `src/app/(admin)/admin/login/page.tsx` compara `accessCode === 'GI2026'`.
- Em seguida grava `admin_bypass=true` no `localStorage`.

Impacto:

Esse codigo da acesso ao painel sem sessao real. Como a autorizacao das APIs tambem nao existe no servidor, o painel vira apenas uma barreira visual.

Correcao recomendada:

- Remover o campo "Codigo Master".
- Se precisar de acesso emergencial, usar um fluxo server-side com segredo rotacionavel, expiraçao curta, auditoria e MFA.

### Critico - Export administrativo aberto

Evidencias:

- `/api/admin/export` retornou `200` no smoke test sem login.
- A rota inclui `IP_Hash` e `Fingerprint_Hash` no CSV.

Impacto:

Mesmo sendo hashes, sao identificadores persistentes e devem ser tratados como dado sensivel/pseudonimizado. A exposicao publica permite correlacao de manifestacoes.

Correcao recomendada:

- Proteger a rota com `requireAdmin`.
- Remover hashes por padrao do CSV.
- Criar export "auditoria completa" separado, com trilha de auditoria e permissao elevada.
- Escapar CSV corretamente para evitar quebra por virgulas, aspas ou formulas.

### Alto - Next vulneravel segundo npm audit

Evidencia:

- `package.json` usa `next@16.2.4`.
- `npm audit --omit=dev` reportou severidade alta para Next.

Correcao recomendada:

1. Atualizar `next` e `eslint-config-next` para `16.2.6`, conforme audit.
2. Rodar `npm install`.
3. Rodar `npm run build`, `npm run lint` e smoke test.

### Alto - Lint quebrado e CI bloqueante

Evidencias:

- `npm run lint` falhou com 40 erros.
- `.github/workflows/ci.yml` executa `npm run lint`.

Impacto:

O projeto builda localmente, mas a qualidade automatizada nao fecha. Qualquer pipeline serio deve impedir merge/deploy.

Correcao recomendada:

- Ajustar `eslint.config.mjs` para ignorar `scratch/**`, scripts legados `.js` e arquivos temporarios, ou converter scripts para ESM/TS.
- Substituir `any` por tipos locais em fluxo publico, componentes de etapa, graficos e APIs.
- Revisar efeitos que disparam `setState` de forma sincronizada conforme React 19.

### Alto - Anti-fraude manipulavel no cliente

Evidencias:

- `/api/avaliar` aceita `fingerprint`, `startTime`, `endTime` e `honeypot` no body.
- `isSuspiciousTiming` usa apenas diferenca enviada pelo cliente.
- O fingerprint no frontend e gerado com `Math.random()`.

Impacto:

Nao ha garantia de unicidade, taxa, ou tempo real de interacao. Um cliente automatizado consegue enviar tempos validos e fingerprints novos.

Correcao recomendada:

- Gerar token de sessao/nonce server-side ao iniciar avaliacao.
- Salvar timestamp server-side e validar no POST.
- Implementar rate limit por IP hash, user-agent e fingerprint.
- Exigir que atributos enviados pertençam a campanha do candidato.
- Validar `candidatoId`, `avaliacoes`, `valor`, `perfil`, `aprovacao` e `expectativaVitoria` com schema.

### Medio - Modelo de banco e RLS incompletos

Evidencias:

- `prisma/apply_rls.sql` habilita RLS para algumas tabelas, mas nao contempla `manifestacoes` e `parametros_plataforma`.
- README afirma RLS para todas as tabelas.
- Nao ha `prisma/migrations`, apenas SQL manual.

Impacto:

O estado real do banco pode divergir do schema Prisma e da politica anunciada. Sem migracoes formais, e dificil reproduzir ambiente local, staging e producao.

Correcao recomendada:

- Criar baseline com `prisma migrate diff`.
- Passar a usar `prisma migrate dev/deploy`.
- Atualizar RLS para todas as tabelas atuais.
- Remover ou atualizar `initial_schema.sql` se ele nao representa mais a realidade.

### Medio - API publica de candidatos pesada

Evidencia:

- `/api/candidatos` retornou cerca de 465 KB para `take: 50`.
- A rota inclui campanha e atributos completos por candidato.

Impacto:

Carga inicial mais lenta no mobile e custo maior em rede. O fluxo publico deve ser leve.

Correcao recomendada:

- Retornar apenas os campos necessarios para listagem.
- Carregar atributos do candidato apenas apos selecao, ou normalizar payload.
- Adicionar filtros reais por cidade/bairro ou remover query params nao usados.

### Medio - Configuracoes publicas sem filtro

Evidencia:

- `/api/configuracoes/public` retorna todos os registros de `parametroPlataforma`.

Impacto:

Se algum parametro sensivel for criado no admin, ele pode vazar publicamente.

Correcao recomendada:

- Adicionar campo `publico Boolean @default(false)` no modelo, ou filtrar por `grupo`.
- Renomear a rota para refletir apenas parametros publicos.

### Medio - Documentacao desatualizada

Evidencias:

- README cita Next 14/React 18/Tailwind v4.
- Projeto usa Next 16/React 19/Tailwind 3.
- `.env.example` cita `NEXT_PUBLIC_SITE_URL`, mas o codigo usa `NEXT_PUBLIC_APP_URL`.
- `.env.example` lista `ENCRYPTION_KEY`, mas `.env/.env.local` locais nao possuem essa variavel.

Impacto:

Setup de novo desenvolvedor fica inconsistente, e hashes em desenvolvimento/producao podem ficar sem salt se `ENCRYPTION_KEY` nao for configurada.

Correcao recomendada:

- Atualizar README.
- Corrigir `.env.example` para `NEXT_PUBLIC_APP_URL`.
- Adicionar `ENCRYPTION_KEY` nos ambientes reais.
- Remover `JWT_SECRET` se nao for usado.

## 5. Plano de correcao recomendado

### Fase 0 - Congelar e proteger

Objetivo: impedir que algo inseguro va para publico.

1. Fazer commit ou stash das alteracoes atuais em relatorios/graficos antes de grandes correcoes.
2. Remover bypass `GI2026`.
3. Implementar autorizacao server-side em todas as rotas `/api/admin/**`.
4. Proteger `/api/admin/export`.
5. Atualizar Next para versao corrigida indicada pelo audit.
6. Rodar build, lint e smoke test.

### Fase 1 - Fechar qualidade basica

Objetivo: deixar CI verde e VS Code confiavel.

1. Corrigir `eslint.config.mjs` para ignorar `scratch/**` e scripts legados nao produtivos.
2. Tipar `UserData`, `Config`, `AdvancedResults`, payloads de API e props de graficos.
3. Corrigir warnings de hooks React 19.
4. Atualizar README e `.env.example`.
5. Adicionar script `typecheck` se quiser separar TypeScript do build.

### Fase 2 - Robustez de dados e banco

Objetivo: tornar banco reprodutivel e auditavel.

1. Criar migracoes Prisma formais.
2. Revisar RLS em `manifestacoes` e `parametros_plataforma`.
3. Adicionar indices:
   - `avaliacoes(candidato_id, criado_em, is_valid)`
   - `avaliacoes(atributo_id, criado_em, is_valid)`
   - `manifestacoes(candidato_id, criado_em, is_valid)`
   - `candidatos(status, ano_eleicao, cidade)`
4. Recalcular contadores quando moderacao muda `is_valid`.
5. Validar drift entre schema Prisma e banco real com aprovacao explicita antes de rodar scripts contra producao.

### Fase 3 - Anti-fraude e privacidade

Objetivo: reduzir manipulacao e exposicao.

1. Trocar fingerprint aleatorio por mecanismo estavel e transparente.
2. Validar tempo de sessao no servidor.
3. Implementar rate limiting.
4. Validar atributos enviados contra campanha do candidato.
5. Separar dados publicos, administrativos e auditoria sensivel.
6. Revisar retencao de IP hash, fingerprint hash, user-agent e perfil.

### Fase 4 - Evolucao de produto

Objetivo: tornar a plataforma finalizavel e demonstravel.

1. Melhorar payload de candidatos e performance mobile.
2. Adicionar estados de erro, loading e vazio nos graficos admin.
3. Criar testes minimos:
   - API admin sem auth retorna 401.
   - API admin com auth permitida retorna 200.
   - POST `/api/avaliar` rejeita payload invalido.
   - `/api/candidatos` respeita filtros.
4. Adicionar Playwright ou Cypress para fluxo `/avaliar`.
5. Adicionar monitoramento de erros e Web Vitals.

## 6. Checklist para continuar no VS Code

Ordem sugerida de trabalho:

1. Abra `AUDITORIA_TECNICA.md`.
2. Resolva primeiro seguranca admin.
3. Rode:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

4. So depois avance para ajustes visuais e relatorios.
5. Antes de mexer em banco real, confirme ambiente e crie backup/snapshot.

## 7. Comandos uteis

```bash
npm run dev
npm run lint
npm run build
npx prisma validate
npm audit --omit=dev
git status --short
```

## 8. Observacoes sobre trabalho local

O worktree ja tinha alteracoes antes desta auditoria:

- `src/app/(admin)/admin/relatorios/page.tsx`
- `src/app/api/admin/relatorios/route.ts`
- `src/components/admin/charts/AprovacaoChart.tsx`
- `src/components/admin/charts/BairroTreeMap.tsx`
- `src/components/admin/charts/DemographicRadarChart.tsx`
- `src/components/admin/charts/TopAtributosChart.tsx`

Essas alteracoes parecem adicionar novos graficos e dados de relatorio. Elas devem ser preservadas e revisadas antes de qualquer refactor amplo.

## 9. Atualizacao de deploy final

Status em 2026-05-19:

- Deploy de producao concluido na Vercel.
- URL publica: `https://SEU-DOMINIO-PULSOMS`
- URL Vercel: `https://SEU-PROJETO-PULSOMS.vercel.app`
- Projeto/time: `SEU-TIME-VERCEL/SEU-PROJETO-PULSOMS`
- Deployment ID validado: `dpl_...`
- Smoke publico de producao aprovado com `npm run smoke`.
- Smoke de seguranca anonimo aprovado com `npm run smoke:security`.
- Rotas administrativas sem token retornaram `401`.
- Tabelas sensiveis continuaram bloqueadas para acesso anonimo.

Pendencias finais recomendadas:

1. Rodar `npm run smoke:admin` em producao com um `access_token` administrativo temporario.
2. Confirmar no Supabase Auth as URLs permitidas para `https://SEU-DOMINIO-PULSOMS`.
3. Rotacionar credenciais sensiveis que tenham sido expostas em chat, terminal ou arquivo local.
4. Fazer commit de fechamento do sprint de deploy.

## 10. Hotfix de busca de candidatos - 2026-05-19

Falha identificada em producao:

- A etapa publica de busca de candidatos ficava vazia quando o respondente informava bairro.
- A API `/api/candidatos` aplicava `bairro contains <bairro informado>`.
- O banco real possui candidatos ativos sem `bairro` preenchido.

Correcao implementada:

- O bairro deixou de ser criterio de filtro de candidatos.
- A cidade tambem deixou de ser criterio restritivo da lista publica de candidatos.
- Cidade e bairro permanecem no perfil do respondente e continuam sendo enviados no registro da manifestacao.
- A busca publica passou a listar todos os candidatos ativos disponiveis.
- O campo de busca passou a filtrar por `nome`, `cargo`, `partido` ou `cidade` do candidato.
- O smoke test passou a validar que `cidade`/`bairro` do respondente nao zeram a lista e que a busca localiza candidatos por `cargo` e `cidade`.

Validacoes:

```bash
npx prisma validate # passou
npm run lint        # passou
npm run build       # passou
npm run smoke       # passou; busca ignora cidade/bairro do respondente e pesquisa por cargo/cidade
```

Deploy:

- Hotfix publicado em producao na Vercel.
- Deployment ID final: `dpl_75LujQ9cPqw6X3YEB49N11K4F11M`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- Validacao direta em producao:
  - `/api/candidatos?cidade=Campo%20Grande&bairro=Centro` retornou 50 candidatos.
  - `search=VEREADOR` e `search=CAMPO GRANDE` retornaram candidatos por cargo/cidade.
- `npm run smoke` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 27. Sprint - LGPD, transparencia e retencao de perfil - 2026-05-20

Correcoes executadas:

- Criada pagina publica `/privacidade`.
- Criada pagina publica `/termos`.
- Home passou a exibir links para Privacidade e Termos.
- Etapa de CEP passou a linkar diretamente para a politica de privacidade.
- `.env.example` recebeu:
  - `PROFILE_RETENTION_DAYS=730`;
  - `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL`;
  - `IBGE_CEPS_MS_PARQUET_PATH`.
- Criado `scripts/profile-retention.mjs`.
- Adicionados scripts:
  - `npm run profile:retention`;
  - `npm run profile:retention:apply`.
- A retencao de perfil roda em dry-run por padrao.
- Quando aplicada, reduz perfis antigos, preservando apenas:
  - cidade;
  - bairro;
  - UF;
  - origem territorial;
  - confianca do bairro;
  - metadado de retencao aplicada.
- Criado `docs/lgpd-retencao.md`.
- `docs/checklist-producao.md` passou a incluir:
  - smoke operacional;
  - validacao de privacidade/termos;
  - retencao de perfil;
  - recomendacao de smokes sequenciais.

Validacoes:

```bash
npm run profile:retention # passou em dry-run; 0 perfis expirados
npm run audit:retention   # passou em dry-run; 0 logs expirados
npm run lint              # passou
npx prisma validate       # passou
npm audit --omit=dev      # 0 vulnerabilidades
npm run build             # passou
/privacidade              # 200 local
/termos                   # 200 local
npm run smoke:ops         # passou
npm run smoke             # passou
npm run smoke:public      # passou
npm run smoke:security    # passou; checks admin autenticados foram pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_EHfLRcVHwVAQyvKFhL4du9Qkx86T`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/privacidade` em producao: 200.
- `/termos` em producao: 200.
- `npm run smoke:ops` em producao: passou.
- Uma primeira rodada de smokes pesados em producao gerou falso negativo por pressao momentanea no pool do banco.
- `scripts/smoke-http.mjs`, `scripts/public-flow-smoke.mjs` e `scripts/security-smoke.mjs` passaram a aplicar pausa padrao quando `SMOKE_BASE_URL` usa `https://`.
- Reexecucao sequencial em producao passou:
  - `npm run smoke:ops`;
  - `npm run smoke`;
  - `npm run smoke:public`;
  - `npm run smoke:security`.
- `npm run smoke:admin` em producao passou com token Supabase temporario de usuario admin autorizado:
  - `/api/admin/stats` -> 200;
  - `/api/admin/rodadas` -> 200;
  - `/api/admin/relatorios` -> 200;
  - `/api/admin/audit-logs` -> 200;
  - `/api/admin/ceps` -> 200.

Observacao juridica:

- Os textos de `/privacidade` e `/termos` sao uma base operacional tecnica.
- Antes de uso institucional definitivo, devem ser revisados por responsavel juridico.

Pendencias apos este sprint:

- Executar `npm run smoke:admin` com token valido.
- Revisar worktree/diffs.
- Fazer commit de fechamento.
- Rotacionar credenciais sensiveis expostas durante o desenvolvimento.

## 28. Sprint - Fluxo condicional de CEP e bairros - 2026-05-20

Correcoes executadas:

- A etapa fixa de confirmacao de cidade/bairro deixou de ser obrigatoria antes da busca de candidatos.
- Nova regra de fluxo publico:
  - CEP resolvido com cidade/bairro e sem ambiguidade: segue direto para busca de candidato apos o perfil demografico;
  - CEP com multiplas localidades/bairros: mostra apenas confirmacao curta de bairro;
  - CEP nao encontrado: permite informar cidade/bairro manualmente;
  - usuario deseja corrigir: busca de candidatos exibe acao discreta "Corrigir".
- A tela de busca de candidatos passou a mostrar a regiao territorial usada na manifestacao, sem sugerir que ela filtre candidatos.
- A acao "Corrigir" leva o usuario para a etapa territorial condicional.
- O botao de volta da busca retorna ao perfil demografico, preservando o fluxo encurtado.
- A etapa territorial passou a aceitar digitacao livre de cidade, com sugestoes por `datalist`, em vez de bloquear em uma lista curta.
- A API `/api/avaliar` passou a normalizar `cidade`, `bairro` e `uf` antes de salvar o perfil da manifestacao, reduzindo duplicidades nos relatorios por caixa, espacos ou digitacao manual.
- `docs/metodologia-pulso-eleitoral-ms.md` foi atualizado para documentar o fluxo condicional de localizacao.

Validacoes locais:

```bash
npm run lint          # passou
npx prisma validate   # passou
npm run build         # passou
npm run smoke         # passou
npm run smoke:public  # passou
npm run smoke:security # passou; checks admin autenticados pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_8pdA6aNxvtxb77KgCfaYNxNS78Gz`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke:ops` em producao: passou.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.
- `npm run smoke:admin` em producao: passou com token Supabase temporario de usuario admin autorizado.

## 25. Sprint - Governanca metodologica de rodadas - 2026-05-20

Correcoes executadas:

- A API `/api/admin/rodadas` passou a validar regras de governanca antes de criar ou atualizar rodadas.
- Rodadas ativas agora exigem:
  - campanha vinculada;
  - objetivo metodologico;
  - data de inicio de campo.
- Rodadas encerradas exigem data de fim de campo.
- Rodadas do tipo `pesquisa_registravel`, quando ativas ou encerradas, exigem:
  - tamanho de amostra;
  - margem de erro;
  - nivel de confianca;
  - plano amostral;
  - questionario.
- A API passou a impedir mais de uma rodada ativa para a mesma campanha.
- Rodadas encerradas ou arquivadas ficaram travadas para edicao comum, preservando historico metodologico.
- A tela `/admin/metodologia` passou a exibir checklist de governanca por rodada.
- Rodadas encerradas/arquivadas aparecem como travadas na interface.
- Logs de atualizacao de rodada passaram a registrar o status anterior.

Validacoes:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou apos liberar processo local que bloqueava DLL do Prisma
npm run smoke          # passou
npm run smoke:public   # passou
npm run smoke:security # passou; checks admin autenticados foram pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Observacao de validacao:

- Uma execucao paralela dos smokes gerou falso negativo local no `smoke:public` e erro nativo do Node/Windows.
- A validacao sequencial confirmou `/api/cep`, `/api/candidatos`, `/api/health`, `smoke`, `smoke:public` e `smoke:security` funcionando corretamente.

Pendencias apos este sprint:

- Executar `npm run smoke:admin` com token valido para validar CRUD/consulta admin autenticada.
- Criar filtros territoriais interativos em relatorios, caso necessario.
- Avancar para observabilidade operacional.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_CpEj687pm16PTPAz6iWetYD9iBc5`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 26. Sprint - Observabilidade operacional - 2026-05-20

Correcoes executadas:

- `/api/health` foi ampliado para diagnostico operacional.
- O healthcheck passou a medir:
  - latencia do banco;
  - campanhas ativas;
  - candidatos publicos;
  - rodadas ativas;
  - total de CEPs MS;
  - percentual de CEPs com baixa confianca;
  - manifestacoes nas ultimas 24h;
  - avaliacoes nas ultimas 24h;
  - audit logs nos ultimos 7 dias;
  - bloqueios ativos;
  - tempo total de resposta.
- O dashboard admin passou a consumir `/api/health` e exibir status operacional real, em vez de indicadores fixos.
- Criado `scripts/ops-smoke.mjs`.
- Adicionado script `npm run smoke:ops`.
- `npm run smoke` passou a validar tambem o contrato ampliado de CEPs no healthcheck.

Validacoes:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:ops      # passou
npm run smoke:public   # passou
npm run smoke:security # passou; checks admin autenticados foram pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Pendencias apos este sprint:

- Integrar alertas externos, se desejado, usando `/api/health` ou `npm run smoke:ops`.
- Executar `npm run smoke:admin` com token valido.
- Avancar para LGPD, retencao territorial/demografica e fechamento tecnico.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID inicial: `dpl_GXVcZBFoT2AhR88Q8yxe2awoz1cs`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- O primeiro `smoke:ops` em producao identificou degradacao real em `/api/health`.
- Hotfix aplicado: metricas auxiliares do healthcheck passaram a ser resilientes; banco e escopo publico continuam criticos.
- Deployment ID do hotfix: `dpl_6FkKZdJA8RKWoKZ3jAkw1628ojzh`
- Validacao direta de `/api/health` apos hotfix retornou `status = ok`, com:
  - `publicCandidates = 13527`;
  - `cepsMs = 11941`;
  - `cepsBaixaConfiancaPct = 22`;
  - `rodadasAtivas = 0` como check degradado, sem derrubar o core publico.
- `npm run smoke:ops` em producao: passou.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

Observacao operacional:

- Executar smokes pesados em paralelo pode pressionar o pool Supabase/Vercel e gerar falsos negativos temporarios.
- Para validacao final, preferir a ordem sequencial:
  1. `npm run smoke:ops`
  2. `npm run smoke`
  3. `npm run smoke:public`
  4. `npm run smoke:security`
  5. `npm run smoke:admin` quando houver token valido.

## 23. Sprint - Curadoria administrativa de território e CEPs - 2026-05-20

Correcoes executadas:

- Criada rota protegida `/api/admin/ceps`.
- Criada tela admin `/admin/territorio`.
- A navegacao administrativa passou a exibir a area "Territorio".
- A tela permite listar CEPs por:
  - baixa confianca;
  - ambiguidade de localidades;
  - revisados;
  - todos.
- A tela permite busca por CEP, cidade ou bairro.
- A tela exibe resumo operacional da base:
  - total de CEPs;
  - CEPs ambiguos;
  - CEPs de baixa confianca;
  - CEPs revisados.
- A tela exibe localidades possiveis por CEP e permite marcar uma delas como bairro principal revisado.
- Revisoes administrativas atualizam `ceps_ms.bairro`, ajustam `bairro_confianca` para 1 e marcam a origem como revisada.
- Revisoes de CEP geram AuditLog com acao `CEP_MS_REVISADO`.
- `npm run smoke` passou a verificar `/admin/territorio` e `/api/admin/ceps` sem token.
- `npm run smoke:security` passou a incluir `/api/admin/ceps` nos checks autenticados opcionais.

Validacoes:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou
npm run smoke          # passou
npm run smoke:public   # passou
npm run smoke:security # passou; checks admin autenticados foram pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Pendencias apos este sprint:

- Executar `npm run smoke:admin` com token valido para testar a rota `/api/admin/ceps` autenticada.
- Criar relatorios territoriais mais profundos por cidade/bairro do respondente.
- Normalizar nomes parecidos de bairros/localidades, como grafias abreviadas e acentuacao.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_2R7JKNPHzteVbMXkDBMRygkZ9LcU`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- Primeira tentativa de deploy falhou por `ECONNRESET` na API da Vercel; a segunda tentativa passou.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 24. Sprint - Relatorios territoriais por respondente - 2026-05-20

Correcoes executadas:

- `/api/admin/relatorios` passou a retornar bloco `territorio`.
- O bloco territorial usa exclusivamente cidade/bairro do perfil da manifestacao, isto e, a origem territorial do respondente.
- Foram adicionados indicadores de qualidade territorial:
  - percentual de manifestacoes com cidade;
  - percentual com bairro;
  - percentual com confianca de CEP;
  - percentual com baixa confianca de bairro.
- Foram adicionados rankings detalhados:
  - cidades das vozes;
  - bairros das vozes.
- Cada cidade/bairro passou a exibir:
  - volume de manifestacoes;
  - aprovacao;
  - expectativa de vitoria;
  - candidato mais citado naquela origem territorial.
- Foi criado cruzamento `candidato x cidade do respondente`, exibindo manifestacoes, aprovacao e expectativa.
- A tela `/admin/relatorios` passou a exibir a leitura territorial antes dos graficos gerais.

Validacoes:

```bash
npx prisma validate    # passou
npm run lint           # passou
npm run build          # passou apos liberar processo local que bloqueava DLL do Prisma
npm run smoke          # passou
npm run smoke:public   # passou
npm run smoke:security # passou; checks admin autenticados foram pulados por ausencia de ADMIN_SMOKE_TOKEN
```

Pendencias apos este sprint:

- Executar `npm run smoke:admin` com token valido para validar o retorno autenticado de `/api/admin/relatorios`.
- Evoluir para filtros territoriais interativos no admin, por cidade/bairro.
- Criar mapas ou visualizacao geografica em sprint posterior, se fizer sentido para a operacao.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_4AG1vKWnytA9hAGhj4W9KYGMjxZs`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 12. Sprint - Cache interno de CEP MS - 2026-05-20

Correcoes executadas:

- Criado modelo Prisma `CepMs`, mapeado para a tabela `ceps_ms`.
- Criada e aplicada a migracao `20260520150000_add_ceps_ms` no Supabase real.
- A rota `/api/cep/[cep]` passou a operar em modo cache-first:
  - valida CEP com 8 digitos;
  - aceita apenas faixa numerica de Mato Grosso do Sul (`79000000` a `79999999`);
  - consulta primeiro a tabela interna `ceps_ms`;
  - em caso de ausencia, consulta BrasilAPI CEP v2;
  - grava cidade, bairro, logradouro, UF e origem na tabela interna;
  - consultas seguintes retornam do cache interno.
- A manifestacao publica continua sem salvar o CEP completo do respondente.
- O perfil da manifestacao salva apenas cidade, bairro, UF e origem do dado territorial.
- `db-preflight` passou a auditar a existencia de `ceps_ms`.
- RLS foi habilitado em `ceps_ms`.
- A policy de `ceps_ms` restringe acesso direto ao `service_role`, evitando exposicao pela anon key do Supabase.

Validacao funcional local:

- Primeira chamada para `/api/cep/79002000`: `cache = miss`, com gravacao no banco.
- Segunda chamada para `/api/cep/79002000`: `cache = hit`, retornando do banco interno.
- Retorno validado:
  - cidade: Campo Grande;
  - bairro: Centro;
  - UF: MS;
  - logradouro: Avenida Calogeras;
  - origem: brasilapi.

Validacoes:

```bash
npx prisma validate    # passou
npm run db:deploy      # passou; migracao ceps_ms aplicada
npm run db:rls:apply   # passou
npm run db:status      # passou; banco em dia
npm run db:preflight   # passou; RLS habilitado nas 11 tabelas esperadas
npm run lint           # passou
npm run build          # passou
npm audit --omit=dev   # 0 vulnerabilidades
npm run smoke          # passou
npm run smoke:public   # passou
npm run smoke:security # passou; ceps_ms bloqueada para anon key via PostgREST
```

Observacao:

- O smoke de seguranca agora mostra 7 avisos de catalogo indisponivel via anon key, incluindo `ceps_ms`. Para a arquitetura atual isso e esperado, pois o frontend consome a rota Next `/api/cep/[cep]`, e nao PostgREST direto.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_DeEyQikQ7SWZHtSG9NKJ3oFJFdq7`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- Validacao direta em producao:
  - `/api/cep/79002000` retornou Campo Grande, Centro, MS, origem `brasilapi` e `cache = hit`.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 13. Sprint - Smoke publico de fluxo e painel final - 2026-05-20

Correcoes executadas:

- Criado `scripts/public-flow-smoke.mjs`.
- Adicionado script `npm run smoke:public`.
- O novo smoke valida, sem gravar manifestacao real:
  - disponibilidade de candidatos publicos;
  - existencia de atributos visiveis vinculados a campanha do candidato;
  - criacao de sessao assinada de avaliacao em `/api/avaliar/session`;
  - rejeicao de avaliacao com atributo invalido em `/api/avaliar`;
  - contrato completo do painel `/api/resultados/[candidatoId]/percepcao`;
  - resposta basica de atributos em `/api/resultados/[candidatoId]`.
- README, checklist de producao e runbook de banco/RLS passaram a listar `npm run smoke:public`.

Resultado local:

```bash
npx prisma validate # passou
npm run lint        # passou
npm run build       # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_GmcYM1SBjbpeUhZ4yEzhgcgJHC1b`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 21. Sprint - Integracao BrasilAPI CEP e anonimato nominal - 2026-05-20

Correcoes executadas:

- Criada rota interna `/api/cep/[cep]`.
- A rota consulta `https://brasilapi.com.br/api/cep/v2/{cep}` no servidor.
- A resposta interna retorna apenas:
  - cidade;
  - bairro;
  - UF;
  - logradouro;
  - origem `brasilapi`.
- A etapa inicial do fluxo publico deixou de pedir nome/apelido.
- A etapa inicial passou a pedir CEP para localizar cidade/bairro.
- O usuario pode confirmar/corrigir cidade e bairro na etapa seguinte.
- O envio da manifestacao sanitiza o perfil e nao salva nome nem CEP completo.
- O perfil salvo mantem apenas cidade, bairro, UF e origem da localidade.
- O smoke publico passou a validar `/api/cep/79002000`.
- A metodologia foi atualizada para documentar que CEP e usado apenas para preenchimento territorial.

Validacao da BrasilAPI:

- `79002000` retornou:
  - cidade: Campo Grande;
  - bairro: Centro;
  - UF: MS;
  - logradouro: Avenida Calogeras.

Validacoes:

```bash
npm run lint        # passou
npx prisma validate # passou
npm run build       # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou, incluindo consulta CEP
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_27ytMBrTybYXzhJsudAnW8g6egVB`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/cep/79002000` em producao retornou Campo Grande, Centro, MS.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou, incluindo consulta CEP.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_5fjtkLFmnMYHah2E2XA8kfpUxMUF`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/health` em producao retornou `status: ok`, 4 campanhas ativas e 13.527 candidatos publicos.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 20. Sprint - Resultado publico enxuto e mobile first - 2026-05-20

Correcoes executadas:

- A tela publica "Inteligencia do Pulso" passou a exibir ao cidadao apenas:
  - grafico radar / teia de aranha;
  - principais forcas percebidas;
  - cidades das vozes;
  - bairros das vozes.
- Foram removidos da experiencia publica:
  - aprovacao percebida;
  - desaprovacao;
  - expectativa de vitoria;
  - saldo de percepcao;
  - leitura rapida;
  - pontos de atencao;
  - total de vozes validas.
- Esses dados continuam calculados pela API e podem seguir disponiveis para uso interno/admin.
- Layout final ficou mais mobile first:
  - menor padding horizontal;
  - card 3x4 mais compacto;
  - radar com titulo proprio;
  - listas em cards verticais;
  - botao final com menor `tracking` para caber melhor em telas estreitas.

Validacoes:

```bash
npm run lint        # passou
npx prisma validate # passou
npm run build       # passou apos liberar lock local do Prisma no Windows
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou
```

## 19. Validacao - Smoke admin autenticado em producao - 2026-05-20

Validacao executada com token Supabase temporario de usuario admin autorizado.

Resultado:

- `npm run smoke:admin` em producao: passou.
- Tabelas sensiveis via anon key continuaram bloqueadas:
  - `manifestacoes` -> `401`;
  - `avaliacoes` -> `401`;
  - `bloqueios` -> `401`;
  - `audit_logs` -> `401`.
- Rotas admin autenticadas retornaram `200`:
  - `/api/admin/stats`;
  - `/api/admin/rodadas`;
  - `/api/admin/relatorios`;
  - `/api/admin/audit-logs`.

Avisos mantidos:

- O acesso direto anonimo via PostgREST para catalogo publico segue retornando `401` em:
  - `campanhas`;
  - `atributos`;
  - `campanha_atributos`;
  - `candidatos`;
  - `parametros_plataforma`;
  - `rodadas_metodologicas`.
- Isso nao quebra a arquitetura atual, pois o frontend publico consome APIs Next/Prisma, nao PostgREST direto.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_3RzTmSZ8r6RU4NUVzcQmomaxeoib`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/health` em producao retornou:
  - `status: ok`;
  - banco `ok`;
  - campanhas ativas `ok`;
  - candidatos publicos `ok`;
  - 4 campanhas ativas;
  - 13.527 candidatos publicos.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 18. Sprint - Foto 3x4 no resultado final - 2026-05-20

Correcoes executadas:

- A etapa final de resultado passou a receber `foto_url`, cargo, cidade e partido do candidato selecionado.
- O painel "Inteligencia do Pulso" passou a exibir um card de identificacao do candidato antes do radar:
  - foto em formato vertical tipo 3x4;
  - nome do candidato;
  - cargo, partido e cidade;
  - selo "Percepcao coletiva".
- A foto usa o componente `CandidatePhoto`, com fallback visual caso a imagem remota do Supabase Storage ainda nao esteja disponivel.
- A mudanca preserva o painel metodologico e os indicadores ja existentes.

Validacoes:

```bash
npm run lint        # passou
npx prisma validate # passou
npm run build       # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou
```

## 17. Sprint - Gestao de assets e fotos de candidatos - 2026-05-20

Correcoes executadas:

- Confirmado que `.vercelignore` exclui `public/candidatos/**` do upload para Vercel.
- Criado `scripts/assets-audit.mjs`.
- Adicionado script `npm run assets:audit`.
- Criado runbook `docs/assets-candidatos.md`.
- `next.config.ts` passou a permitir imagens remotas do Supabase Storage no bucket publico `candidatos`.
- `/api/candidatos` passou a resolver caminhos legados `/candidatos/...` para URLs do Supabase Storage.
- Criado componente `CandidatePhoto` com fallback visual para evitar imagem quebrada quando a foto remota ainda nao estiver disponivel.
- Etapas publicas de busca e atributos passaram a usar `CandidatePhoto`.

Auditoria de assets:

- Arquivos locais em `public/candidatos`: 17.198.
- Tamanho local total: 473,13 MB.
- Candidatos no banco: 15.115.
- Candidatos com foto: 15.115.
- Referencias legadas `/candidatos/...`: 15.115.
- URLs remotas ja persistidas no banco: 0.
- Arquivos locais órfãos: 2.083.
- Referencias sem arquivo local correspondente: 0.

Observacao operacional:

- Teste direto em uma URL do Supabase Storage retornou `400`, indicando que o bucket/objeto publico ainda precisa ser conferido ou que o upload das fotos deve ser executado com `npm run upload-assets` usando `SUPABASE_SERVICE_ROLE_KEY`.
- Como mitigacao, o frontend exibe avatar fallback quando a imagem remota falhar.

Validacoes:

```bash
npm run assets:audit # passou
npm run lint         # passou
npx prisma validate  # passou
npm run build        # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke        # passou
npm run smoke:public # passou
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_8giNxoGGHE9rR19bs65S9VqXUudq`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/candidatos` em producao passou a retornar `foto_url` resolvida para Supabase Storage.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 16. Sprint - Dossie metodologico HTML - 2026-05-20

Correcoes executadas:

- A rota protegida `/api/admin/rodadas/[id]/dossie` passou a aceitar `?format=html`.
- O formato JSON existente foi preservado como padrao.
- O HTML inclui:
  - identificacao da rodada;
  - escopo operacional;
  - indicadores de qualidade;
  - metodologia declarada;
  - atributos mais frequentes;
  - enquadramento de comunicacao;
  - estilo proprio para impressao/salvamento em PDF pelo navegador.
- A tela `/admin/metodologia` passou a oferecer duas acoes:
  - `Baixar JSON`;
  - `Baixar HTML`.
- A trilha de auditoria de dossie registra o formato gerado (`json` ou `html`).
- A rota HTML permanece protegida por token admin, retornando `401` sem autenticacao.

Validacoes:

```bash
npm run lint        # passou
npx prisma validate # passou
npm run build       # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou
```

Teste de protecao:

- `/api/admin/rodadas/smoke/dossie?format=html` sem token retornou `401`.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_HMv5dEfKCH6CbpE5zzDaWiN1AAae`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/admin/rodadas/smoke/dossie?format=html` sem token retornou `401` em producao.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 15. Sprint - Revisao visual/mobile do fluxo publico - 2026-05-20

Correcoes implementadas localmente:

- Header publico ajustado para telas pequenas, com melhor truncamento e menor risco de sobreposicao.
- Etapa de busca de candidatos recebeu:
  - largura util maior em desktop/tablet;
  - cards mais legiveis;
  - quebra de texto para nomes longos;
  - icones `lucide-react` em vez de caracteres soltos;
  - botao de busca com area de toque mais adequada.
- Etapa de atributos recebeu:
  - grade responsiva em 2 colunas no mobile e 3 em telas maiores;
  - botoes com altura minima de toque;
  - melhor quebra de texto para atributos longos;
  - barra inferior respeitando `safe-area-inset-bottom`.
- Etapas de aprovacao e expectativa receberam:
  - layout em duas colunas em telas maiores;
  - icones `lucide-react`;
  - menor `tracking` em mobile para evitar texto comprimido.
- Painel final recebeu:
  - largura maxima ampliada;
  - cards menos apertados;
  - melhor quebra de textos e labels;
  - grade de indicadores adaptavel em telas muito estreitas.

Validacoes:

```bash
npm run lint
npx prisma validate
npm run build
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke
npm run smoke:public
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_4Y3CzswKesEoTuf9CQ3vdVERZiwC`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `/api/health` em producao retornou:
  - `status: ok`;
  - banco `ok`;
  - campanhas ativas `ok`;
  - candidatos publicos `ok`;
  - 4 campanhas ativas;
  - 13.527 candidatos publicos.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_6RRhXogdq53T9Vo6qkBpaNuFrFxj`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 14. Sprint - Observabilidade operacional e healthcheck - 2026-05-20

Correcoes executadas:

- Criada rota publica segura `/api/health`.
- O healthcheck valida:
  - conexao com banco;
  - existencia de campanhas ativas;
  - existencia de candidatos disponiveis no escopo publico;
  - modo atual do escopo publico sem expor IDs ou credenciais.
- A resposta usa `Cache-Control: no-store` e rota dinamica para refletir o estado real da producao.
- `scripts/smoke-http.mjs` passou a validar `/api/health` e seu contrato.
- README e checklist de producao foram atualizados com a etapa de observabilidade.

Validacao local:

- `/api/health` retornou `status: ok`.
- Banco: `ok`.
- Campanhas ativas: 4.
- Candidatos publicos: 13.527.
- Escopo publico: `all_active`.

Validacoes:

```bash
npx prisma validate # passou
npm run lint        # passou
npm run build       # passou
npm audit --omit=dev # 0 vulnerabilidades
npm run smoke       # passou
npm run smoke:public # passou
```

## 12. Sprint - Painel de percepcao coletiva - 2026-05-20

Correcoes executadas:

- A API `/api/resultados/[candidatoId]/percepcao` passou a retornar um painel preenchido com dados reais das manifestacoes validas.
- O painel final "Inteligencia do Pulso - Percepcao coletiva" deixou de depender de referencias ou indicadores simulados.
- Foram adicionados indicadores mais compreensiveis para o cidadao comum:
  - vozes validas;
  - aprovacao percebida;
  - desaprovacao;
  - expectativa de vitoria;
  - saldo de percepcao;
  - leitura rapida em linguagem simples.
- O bloco de atributos foi separado em:
  - principais forcas percebidas;
  - pontos de atencao.
- A origem territorial passou a usar cidade/bairro informados pelo respondente no perfil da manifestacao.
- O painel passou a exibir aviso metodologico explicito: os dados sao manifestacoes espontaneas da plataforma e nao pesquisa eleitoral registrada.
- A API `/api/resultados/[candidatoId]` foi ajustada para retornar ate 8 atributos de maior volume, evitando grafico vazio quando ha poucos dados.

Validacao local com candidato real:

- Candidato testado: `cand-120002320073`.
- `/api/resultados/cand-120002320073/percepcao` retornou:
  - 1 voz valida;
  - aprovacao percebida de 0%;
  - desaprovacao de 100%;
  - expectativa de vitoria de 100%;
  - cidade do respondente: Aquidauana;
  - bairro do respondente: Juita;
  - forcas e alertas preenchidos com atributos reais.

Validacoes:

```bash
npx prisma validate # passou
npm run lint        # passou
npm run build       # passou
npm run smoke       # passou
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_HX6a5agFt8nvViwy3dJ9R4b53GLC`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- Validacao direta em producao:
  - `/api/resultados/cand-120002320073/percepcao` retornou painel preenchido com vozes validas, aprovacao/desaprovacao, expectativa, forcas, alertas e origem territorial.
- `npm run smoke` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 11. Sprint - Campanhas como escopo real da plataforma - 2026-05-20

Correcoes executadas:

- Criado helper `src/lib/publicScope.ts` para centralizar o escopo publico.
- A API publica `/api/candidatos` passou a listar candidatos ativos de campanhas ativas.
- O filtro fixo `ano_eleicao in [2022, 2024]` deixou de ser a regra unica da experiencia publica.
- A busca publica continua aceitando texto livre por `nome`, `cargo`, `partido` ou `cidade` do candidato.
- A criacao de sessao em `/api/avaliar/session` passou a validar o mesmo escopo publico antes de permitir avaliacao.
- O POST `/api/avaliar` tambem passou a validar o mesmo escopo publico antes de gravar manifestacao.
- A tela admin de configuracoes recebeu parametros reais de escopo publico:
  - `public_scope_mode`
  - `public_anos_ativos`
  - `public_campanhas_ativas`
- O painel de campanhas passou a exibir candidatos publicos calculados e se a campanha esta visivel ao usuario.
- A lista admin de candidatos passou a usar o mesmo escopo publico da busca do usuario.
- Relatorios administrativos passaram a calcular cidade/bairro a partir de `manifestacao.perfil`, isto e, do respondente, nao do candidato.

Estado validado localmente:

- Escopo antigo 2022/2024: 6.639 candidatos ativos.
- Novo escopo por campanhas ativas: 13.527 candidatos ativos.
- Distribuicao do novo escopo:
  - 2018: 357 ativos
  - 2020: 6.531 ativos
  - 2022: 366 ativos
  - 2024: 6.273 ativos

Validacoes:

```bash
npx prisma validate # passou
npm run lint        # passou
npm run build       # passou
npm run smoke       # passou
```

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_D9oyfEw5gJg86XZokifQPocFTG7b`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- `npm run smoke` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.

## 22. Sprint - Base IBGE agregada de CEPs MS - 2026-05-20

Correcoes executadas:

- A tabela `ceps_ms` foi enriquecida para receber agregados territoriais do arquivo IBGE de enderecos/CEP de Mato Grosso do Sul.
- Criada e aplicada a migracao `20260520170000_enrich_ceps_ms_ibge`.
- Criado o importador `scripts/import-ceps-ms-ibge.py`.
- Adicionado script operacional:
  - `npm run ceps:import:ibge`
- `.env.example` passou a documentar `IBGE_CEPS_MS_PARQUET_PATH`.
- O importador le o Parquet, agrega por CEP e grava:
  - cidade;
  - UF;
  - bairro/localidade principal;
  - lista das principais localidades possiveis;
  - confianca da localidade principal;
  - total de registros do CEP;
  - quantidade de localidades;
  - quantidade de logradouros;
  - latitude/longitude medias;
  - origem `ibge_enderecos`.
- A rota `/api/cep/[cep]` passou a retornar metadados de confianca:
  - `confiancaBairro`;
  - `precisaConfirmarBairro`;
  - `bairrosPossiveis`.
- A etapa publica de confirmacao territorial passou a exibir opcoes de localidade quando o CEP e ambiguo.
- O backend de `/api/avaliar` passou a sanitizar o perfil recebido, evitando que campos arbitrarios como CEP completo sejam gravados na manifestacao.

Importacao executada:

- Arquivo analisado: `ibge_enderecos_cep_logradouros_ms.parquet`.
- CEPs agregados/importados: 11.941.
- CEPs com mais de uma localidade: 3.796.
- CEPs com localidade principal abaixo de 80% de confianca: 2.584.
- Faixa de CEP importada: `79002000` a `79995959`.
- Municipios cobertos: 79.

Validacao funcional local:

- `/api/cep/79002000` passou a retornar:
  - cidade: Campo Grande;
  - origem: `ibge_enderecos`;
  - cache: `hit`;
  - confianca do bairro principal: aproximadamente 72,7%;
  - `precisaConfirmarBairro = true`;
  - opcoes como `CHACARA DAS MANSOES` e `CENTRO`.

Validacoes:

```bash
npm run ceps:import:ibge -- "d:\BASE NOVA PE26\.PARQUET\ibge_enderecos_cep_logradouros_ms.parquet" --dry-run # passou
npm run db:deploy       # passou; migracao de enriquecimento aplicada
npm run ceps:import:ibge -- "d:\BASE NOVA PE26\.PARQUET\ibge_enderecos_cep_logradouros_ms.parquet" # passou
npm run db:status       # passou; banco em dia
npm run db:preflight    # passou; RLS habilitado nas 11 tabelas esperadas
npx prisma validate     # passou
npm run lint            # passou
npm run build           # passou
npm audit --omit=dev    # 0 vulnerabilidades
npm run smoke           # passou
npm run smoke:public    # passou
npm run smoke:security  # passou
```

Observacao:

- O CEP completo continua sendo usado apenas para consulta territorial.
- A manifestacao salva cidade, bairro, UF, origem territorial e confianca do bairro, mas nao salva o CEP completo.

Deploy:

- Publicado em producao na Vercel.
- Deployment ID: `dpl_HisLKQyPJuNxkN78be4LZ4Wj1K4K`
- Alias atualizado: `https://SEU-DOMINIO-PULSOMS`
- Validacao direta em producao:
  - `/api/cep/79002000` retornou origem `ibge_enderecos`, `cache = hit`, `precisaConfirmarBairro = true` e bairros possiveis.
- `npm run smoke` em producao: passou.
- `npm run smoke:public` em producao: passou.
- `npm run smoke:security` em producao: passou; checks admin autenticados foram pulados por ausencia de `ADMIN_SMOKE_TOKEN`.
