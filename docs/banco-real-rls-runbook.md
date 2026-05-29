# Banco Real e RLS - Runbook

Este runbook descreve a aplicação controlada das migrações e políticas RLS do **PULSO ELEITORAL MS** no Supabase real.

## Objetivo

- Confirmar conexão com o banco correto.
- Resolver baseline Prisma sem recriar tabelas existentes.
- Aplicar migrações pendentes.
- Aplicar políticas RLS endurecidas.
- Validar que as APIs continuam funcionando via Next/Prisma.

## Pré-requisitos

- Backup/snapshot recente do projeto Supabase.
- `DATABASE_URL` apontando para o banco correto.
- Janela de manutenção definida.
- Confirmação de que a aplicação usa as APIs Next para leitura/escrita de `manifestacoes` e `avaliacoes`.

## Ordem de Execução

1. Verificar ambiente:

```bash
npm run db:preflight
npm run db:status
```

2. Se o banco já existe e ainda não tem histórico Prisma, marcar o baseline como aplicado:

```bash
npx prisma migrate resolve --applied 20260519000000_initial_baseline
```

3. Aplicar migrações pendentes:

```bash
npm run db:deploy
```

4. Aplicar RLS:

```bash
npm run db:rls:apply
```

5. Conferir estado final:

```bash
npm run db:preflight
npm run db:status
npm run build
npm run smoke
npm run smoke:public
npm run smoke:security
npm run smoke:admin
```

## Política RLS Atual

Leitura pública controlada:

- `campanhas`: somente `status = 'ativo'`.
- `atributos`: somente `visivel = true`.
- `campanha_atributos`: leitura pública dos vínculos.
- `candidatos`: somente `status = 'Ativo'`.
- `parametros_plataforma`: somente chaves `geral_%` e `onboarding_%`.
- `rodadas_metodologicas`: somente `status = 'ativa'`.

Tabelas restritas:

- `manifestacoes`
- `avaliacoes`
- `bloqueios`
- `audit_logs`

Essas tabelas devem ser acessadas por rotas server-side da aplicação, não diretamente pelo cliente público.

## Critérios de Aceite

- `npm run db:status` sem migrações pendentes inesperadas.
- `npm run db:preflight` mostra RLS habilitado nas tabelas esperadas.
- `/api/admin/**` retorna `401` sem token.
- `npm run smoke:security` confirma que tabelas sensíveis não retornam dados via anon key.
- `/avaliar`, `/api/candidatos` e `/api/configuracoes/public` continuam respondendo.
- Cadastro, relatório, exportação e dossiê de rodadas funcionam com usuário admin autenticado.

## Teste Autenticado Opcional

Para validar rotas admin com autenticação real, informe um access token Supabase de um usuário listado em `ADMIN_EMAILS`:

```bash
ADMIN_SMOKE_TOKEN=ey... npm run smoke:admin
```

Sem `ADMIN_SMOKE_TOKEN`, `npm run smoke:security` ainda valida RLS via anon key e apenas pula as rotas autenticadas. Já `npm run smoke:admin` falha explicitamente, para não mascarar ausência de teste autenticado real.

Para configurar o login admin e obter uma sessão válida, consulte `docs/acesso-admin.md`.

## Rollback

O rollback deve priorizar restore de snapshot Supabase. Não executar `db push --force-reset` em banco real.

Para uma emergência limitada a RLS, é possível reverter políticas via SQL manual no Supabase, mas isso deve ser documentado no `AuditLog` e seguido de novo preflight.
