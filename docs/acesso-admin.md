# Acesso Admin - PULSO ELEITORAL MS

O painel admin (`/admin/login`) tem login próprio por e-mail e senha. Não depende de provedor externo.

- Senhas: hash PBKDF2 com sal, gravado na tabela `admin_users` do D1. A senha nunca é armazenada nem registrada em log.
- Sessão: cookie `pulso_admin`, HttpOnly, assinado (HMAC-SHA256) com `JWT_SECRET`, válido por 12 h.
- Trocar a senha de um usuário derruba as sessões abertas dele.
- As rotas `/api/admin/**` validam a sessão e o papel no servidor e têm proteção CSRF.

Papéis:

- `admin`: controle total, gestão de usuários, tokens de API, configurações sensíveis e exclusões destrutivas.
- `editor`: edição operacional de ciclos, políticos, órgãos, serviços, atributos, moderação, rodadas e CEPs.
- `viewer`: acesso de leitura ao painel.

## Criar o primeiro admin ou redefinir uma senha

Pelo terminal, com `npx wrangler login` feito numa conta com acesso ao projeto:

```bash
npm run admin:senha -- email@dominio.com
```

A senha (mínimo de 10 caracteres) é digitada sem eco no terminal, e só o hash vai para o D1 de produção. Se o e-mail não existir, o usuário é criado como `admin` ativo.

O primeiro admin de produção é `girassolinteligencia@gmail.com`.

## Gerir usuários pelo painel

Com um usuário `admin`:

1. Acesse `/admin/usuarios`.
2. Informe nome, e-mail, papel e senha.
3. Confirme que o usuário aparece como ativo.

Desativar um usuário bloqueia o login dele na hora.

## Tokens de API

Os tokens para integrações são emitidos em `/admin/api-tokens`. Só o hash HMAC fica no banco, então o token aparece uma única vez, na criação.

## Erros comuns

### Login falha

- Confira se o e-mail está ativo em `/admin/usuarios`.
- Redefina a senha com `npm run admin:senha -- email`.
- O login tem limite de tentativas. Espere um minuto e tente de novo.

### Painel abre, mas as APIs admin retornam 403

- O papel do usuário não permite a operação. Ajuste em `/admin/usuarios` com um `admin`.

### Todos são deslogados ao mesmo tempo

- O segredo `JWT_SECRET` foi trocado. É o comportamento esperado.

### Erro 500 em todas as rotas admin

- Verifique se o segredo `JWT_SECRET` existe e tem pelo menos 32 caracteres (`npx wrangler secret list`).
- Veja os logs com `npx wrangler tail pulso-eleitoral`.
