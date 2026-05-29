# Deploy Vercel - PULSO ELEITORAL MS

## Estado Atual

Deploy de producao realizado com sucesso em:

- Producao: `https://www.vozpublicams.com.br`
- URL Vercel: `https://vozpublica-ms-qwv985br0-girassolinteligencia-8661s-projects.vercel.app`
- Projeto/time: `girassolinteligencia-8661s-projects/vozpublica-ms-br`
- Deployment ID validado: `dpl_EtmBxNuzwocbo1EQRVE7aCZh9G5S`

O smoke publico de producao passou contra `https://www.vozpublicams.com.br`.

A CLI local esta autenticada, mas o arquivo `.vercel/project.json` pode nao existir. Isso e aceitavel para deploy manual, desde que a CLI resolva o projeto correto. Para deixar o repositorio explicitamente linkado, rode:

```powershell
npx vercel link
```

Selecione o time `girassolinteligencia-8661s-projects` e o projeto `vozpublica-ms-br`.

Se aparecer:

```text
Error: Not authorized
```

faça login ou use `VERCEL_TOKEN`.

Se aparecer:

```text
Could not retrieve Project Settings
```

o projeto local está linkado a uma conta/time inacessível pela sessão atual.

## Opção 1: Login Interativo

```bash
npx vercel login
npx vercel whoami
npx vercel env ls
```

Se o link antigo continuar inválido:

```powershell
Remove-Item -Recurse -Force .vercel
npx vercel link
```

Selecione o time/projeto correto ou crie o projeto novamente.

## Opção 2: Token

Configure temporariamente:

```powershell
$env:VERCEL_TOKEN="SEU_TOKEN_VERCEL"
npx vercel whoami --token $env:VERCEL_TOKEN
```

Deploy:

```powershell
npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
Remove-Item Env:VERCEL_TOKEN
```

Se a Vercel retornar limite de arquivos:

```text
files should NOT have more than 15000 items
```

o projeto já ignora `public/candidatos/**` via `.vercelignore`, pois as fotos devem ser servidas pelo Supabase Storage. Como alternativa adicional:

```powershell
npx vercel deploy --prod --yes --archive=tgz
```

## Variáveis Necessárias na Vercel

Configure em **Vercel > Project > Settings > Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO
ADMIN_EMAILS=paulofernandogarciacardoso@gmail.com
EVALUATION_SESSION_SECRET=
ENCRYPTION_KEY=
AUDIT_LOG_RETENTION_DAYS=365
```

Não configure `ADMIN_SMOKE_TOKEN` como variável permanente de produção.

O projeto ja possui estas variaveis configuradas na Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Antes de um novo deploy final, confirme se tambem estao presentes quando aplicavel:

- `ADMIN_EMAILS`
- `EVALUATION_SESSION_SECRET`
- `ENCRYPTION_KEY`
- `AUDIT_LOG_RETENTION_DAYS`

Arquivos locais `.env` e `.env.local` nao devem ser enviados para a Vercel. O `.vercelignore` bloqueia esses arquivos nos proximos deploys.

## Pré-deploy

```bash
npm run db:status
npm run db:preflight
npx prisma validate
npm run lint
npm run build
npm audit --omit=dev
npm run smoke
npm run smoke:security
```

## Pós-deploy

Smoke publico:

```powershell
$env:SMOKE_BASE_URL="https://www.vozpublicams.com.br"
npm run smoke
npm run smoke:security
Remove-Item Env:SMOKE_BASE_URL
```

Smoke administrativo autenticado:

1. Acesse `/admin/login`.
2. Faça login com usuário autorizado.
3. Gere um `access_token` temporário.
4. Rode:

```powershell
$env:SMOKE_BASE_URL="https://SEU-DOMINIO"
$env:ADMIN_SMOKE_TOKEN="ACCESS_TOKEN_TEMPORARIO"
npm run smoke:admin
Remove-Item Env:ADMIN_SMOKE_TOKEN
Remove-Item Env:SMOKE_BASE_URL
```

Se credenciais ou tokens foram compartilhados em chat, terminal, print ou arquivo local, rotacione as chaves sensiveis antes de considerar o ambiente definitivamente fechado.
