# Acesso Admin - PULSO ELEITORAL MS

O painel admin usa Supabase Auth para autenticação e a tabela `admin_users` para autorização. O acesso principal é por e-mail e senha; magic link por e-mail fica como alternativa.

Papéis disponíveis:

- `admin`: controle total, gestão de usuários, tokens, configurações sensíveis e exclusões destrutivas.
- `editor`: edição operacional de ciclos, políticos, órgãos, serviços, atributos, moderação, rodadas e CEPs.
- `viewer`: acesso de leitura ao painel.

`ADMIN_EMAILS` permanece apenas como bootstrap/fallback para garantir o primeiro administrador. O uso normal do painel deve ser gerido em `/admin/usuarios`.

## 1. Conferir variáveis locais

No `.env.local`, configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=seu-email@dominio.com
```

Se estiver usando outro endereço local, como `http://localhost:3010`, use esse valor em `NEXT_PUBLIC_APP_URL`.

## 2. Cadastrar usuário no Supabase Auth

No painel Supabase:

1. Abra o projeto.
2. Vá em **Authentication**.
3. Abra **Users**.
4. Clique em **Add user** ou **Invite user**.
5. Cadastre o e-mail do usuário administrativo.
6. Defina uma senha para esse usuário.

O e-mail usado no login precisa existir no Supabase Auth e estar ativo em `admin_users`. A plataforma não armazena senha no código.

## 3. Cadastrar autorização no painel

Depois de entrar com um usuário `admin`:

1. Acesse `/admin/usuarios`.
2. Informe nome, e-mail e permissão.
3. Clique em **Criar**.
4. Confirme que o usuário aparece na lista como ativo.

O primeiro usuário `admin` de produção foi provisionado como `girassolinteligencia@gmail.com`.

## 4. Liberar URLs de redirecionamento

No painel Supabase:

1. Vá em **Authentication**.
2. Abra **URL Configuration**.
3. Em **Site URL**, configure a URL base da aplicação.
4. Em **Redirect URLs**, adicione as URLs de retorno usadas pelo admin.

Exemplos para desenvolvimento:

```text
http://localhost:3000/admin/dashboard
http://localhost:3010/admin/dashboard
```

Exemplo para produção:

```text
https://pulsoms.ia.br/admin/dashboard
```

## 5. Fluxo de login com senha

1. Abra `/admin/login`.
2. Informe o e-mail cadastrado.
3. Selecione **Senha**.
4. Informe a senha do usuário Supabase Auth.
5. Clique em **Entrar com Senha**.
6. O painel deve abrir em `/admin/dashboard`.

## 6. Fluxo alternativo com magic link

1. Abra `/admin/login`.
2. Selecione **E-mail**.
3. Informe o e-mail cadastrado.
4. Clique em **Enviar Link de Acesso**.
5. Abra o link recebido no e-mail.
6. O link deve redirecionar para `/admin/dashboard`.

## 7. Erros comuns

### Link não chega

- Verifique spam/lixo eletrônico.
- Confira se SMTP/Auth emails estão habilitados no Supabase.
- Confirme se o usuário existe em **Authentication > Users**.
- Confirme se o usuário está ativo em `/admin/usuarios`.

### Login com senha falha

- Confirme se o usuário existe em **Authentication > Users**.
- Confirme se o e-mail está ativo em `/admin/usuarios`.
- Redefina a senha do usuário no Supabase Auth.
- Reinicie o servidor após alterar `.env.local`.

### Link abre, mas volta para login

- Confira se a URL de redirect está cadastrada em **Authentication > URL Configuration**.
- Confira se `NEXT_PUBLIC_APP_URL` bate com a URL usada no navegador.

### Painel abre, mas APIs admin retornam 403

- O e-mail logado não está ativo em `admin_users`.
- A role não permite a operação solicitada.
- Entre com um usuário `admin` e ajuste em `/admin/usuarios`.

### Erro ao criar usuário administrativo

- Confirme se a tabela `admin_users` existe no banco.
- Confirme se a migration `20260616090000_add_admin_users` está aplicada ou registrada em `_prisma_migrations`.
- Confirme se o usuário logado tem role `admin`.
- Verifique logs da Vercel em `/api/admin/users`.

### Smoke autenticado retorna 401

`ADMIN_SMOKE_TOKEN` deve ser o `access_token` de sessão do Supabase, não a anon key, service role key, user id ou UUID.
