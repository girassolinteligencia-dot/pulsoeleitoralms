# Checklist de Produção - PULSO ELEITORAL MS

Use este checklist antes de considerar a plataforma pronta para operação contínua.

## Ambiente

- `NEXT_PUBLIC_SUPABASE_URL` configurado.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada com anon/publishable key válida.
- `DATABASE_URL` configurada com pooler Supabase.
- `DIRECT_URL` configurada quando necessário.
- `NEXT_PUBLIC_APP_URL` configurada para o domínio real.
- `ADMIN_EMAILS` contém somente e-mails autorizados.
- `EVALUATION_SESSION_SECRET` definido com segredo forte.
- `ENCRYPTION_KEY` definido com segredo forte.
- `ADMIN_SMOKE_TOKEN` não fica salvo em produção; use apenas em smoke temporário.
- `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` configurado para contato real de privacidade.
- `PROFILE_RETENTION_DAYS` definido conforme política operacional.

## Supabase Auth

- Usuários admin criados em **Authentication > Users**.
- Senhas definidas ou login magic link configurado.
- Redirect URLs incluem:
  - domínio de produção `/admin/dashboard`;
  - URLs locais necessárias para manutenção.
- SMTP próprio configurado se houver uso frequente de magic link.

## Banco e RLS

Execute:

```bash
npm run db:status
npm run db:preflight
```

Critérios:

- Todas as migrações aplicadas.
- RLS habilitado nas 11 tabelas esperadas.
- Tabelas sensíveis restritas:
  - `manifestacoes`
  - `avaliacoes`
  - `bloqueios`
  - `audit_logs`

## Validação Técnica

Execute:

```bash
npx prisma validate
npm run lint
npm run build
npm audit --omit=dev
npm run smoke:ops
npm run smoke
npm run smoke:public
npm run smoke:security
npm run smoke:admin
```

`npm run smoke:admin` exige um `ADMIN_SMOKE_TOKEN` válido e temporário.

Evite executar smokes pesados em paralelo. A ordem recomendada é:

1. `npm run smoke:ops`
2. `npm run smoke`
3. `npm run smoke:public`
4. `npm run smoke:security`
5. `npm run smoke:admin`

Em `SMOKE_BASE_URL=https://...`, os smokes HTTP aguardam alguns instantes entre chamadas por padrão para não pressionar o pool do banco. Se a produção estiver sensível, aumente a pausa:

```powershell
$env:SMOKE_DELAY_MS="2500"
```

## Observabilidade

- Confirmar healthcheck de produção:

```bash
curl https://SEU-DOMINIO-PULSOMS/api/health
```

Critérios:

- `status` deve ser `ok`.
- `checks.database` deve ser `ok`.
- `checks.activeCampaigns` deve ser `ok`.
- `checks.publicCandidates` deve ser `ok`.
- `checks.cepsMs` deve ser `ok`.

## Auditoria

- Acessar `/admin/auditoria`.
- Confirmar eventos recentes de login operacional indireto:
  - criação/edição de rodadas;
  - exportações;
  - dossiês;
  - moderação;
  - alterações administrativas.
- Rodar retenção em modo dry-run:

```bash
npm run audit:retention
npm run profile:retention
```

Para aplicar limpeza, use somente em janela operacional:

```bash
npm run audit:retention:apply
npm run profile:retention:apply
```

## LGPD e Transparência

- Revisar `/privacidade`.
- Revisar `/termos`.
- Confirmar texto do fluxo público sobre uso do CEP.
- Confirmar que a manifestação não salva CEP completo.
- Confirmar que a política pública diferencia percepção espontânea de pesquisa eleitoral registrada.
- Revisar `docs/lgpd-retencao.md` com responsável jurídico/operacional.

## Produto

- Acessar `/avaliar` em desktop e mobile.
- Criar avaliação completa de teste.
- Confirmar candidatos ativos em `/api/candidatos`.
- Confirmar configurações públicas em `/api/configuracoes/public`.
- Acessar painel admin.
- Abrir:
  - Dashboard;
  - Metodologia;
  - Relatórios;
  - Auditoria;
  - Moderação;
  - Segurança.

## Pós-deploy

- Fazer logout de sessões usadas para smoke.
- Revogar tokens colados em ferramentas externas.
- Confirmar logs de erro da Vercel.
- Confirmar Supabase Auth e Postgres sem alertas.
- Registrar versão/data de deploy no relatório operacional.
