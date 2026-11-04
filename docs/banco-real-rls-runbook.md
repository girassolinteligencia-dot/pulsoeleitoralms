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
- `DIRECT_URL` apontando para uma conexão de migration funcional.
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

### Observação Supabase IPv6 / pooler

Em 2026-06-16, a conexão direta local `db.bbqgskzvguqqejmotbpz.supabase.co:5432` falhou por limitação de IPv6/rede. O caminho que funcionou para SQL de manutenção foi o session pooler:

```text
aws-1-sa-east-1.pooler.supabase.com:5432
```

O transaction pooler na porta `6543` pode falhar em ferramentas que usam prepared statements persistentes. Para migrations manuais, prefira a porta `5432` do pooler quando a URL direta não estiver acessível.

### Migration admin_users aplicada manualmente

A migration `20260616090000_add_admin_users` foi aplicada manualmente em produção em 2026-06-16 porque o Prisma engine não conseguiu alcançar a URL direta Supabase a partir do ambiente local.

Itens aplicados:

- tabela `admin_users`;
- índices `admin_users_email_key`, `admin_users_ativo_idx`, `admin_users_role_idx`;
- seed `girassolinteligencia@gmail.com` com role `admin`;
- registro da migration em `_prisma_migrations`.

Antes de reexecutar migrations, confirme:

```sql
SELECT migration_name, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20260616090000_add_admin_users';
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
- `admin_users`

Essas tabelas devem ser acessadas por rotas server-side da aplicação, não diretamente pelo cliente público.

## Pendência RLS conhecida

A Supabase CLI reportou RLS desabilitado nas tabelas:

- `public._prisma_migrations`
- `public.admin_users`
- `public.orgaos_publicos`
- `public.servicos_publicos`

Não aplique apenas `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sem policies revisadas, pois isso pode bloquear fluxos existentes. SQL sugerido pela Supabase para habilitação, a ser executado somente após definição das policies:

```sql
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgaos_publicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_publicos ENABLE ROW LEVEL SECURITY;
```

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
