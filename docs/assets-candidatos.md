# Fotos e Mídia - PULSO ELEITORAL MS

## Onde ficam

Todas as imagens (candidatos, órgãos, serviços e identidade visual) ficam no bucket R2 `pulso-fotos` (binding `FOTOS`). O próprio Worker as serve pela rota `/fotos/<chave>` ([src/app/fotos/[...key]](../src/app/fotos)).

- Fotos de candidatos do TSE: `candidatos/<ANO>/<SQ_CANDIDATO>.webp` (WebP, até 400×533), importadas por `npm run tse:importar` ([tse-importacao.md](tse-importacao.md)).
- Uploads do admin (órgãos, serviços, identidade): gravados no R2 pelas rotas `/api/admin/**/upload`.

O diretório `public/` contém apenas os assets fixos do site (logo, favicon). Não coloque acervo de fotos ali, porque tudo em `public/` vai para o bundle de assets do Worker.

## Segurança da rota `/fotos`

- Só serve imagens raster (WebP, JPEG, PNG, ICO). SVG e outros tipos são recusados.
- As respostas saem com `Content-Security-Policy: default-src 'none'; sandbox` e `X-Content-Type-Options: nosniff`.
- O upload só pode substituir a foto do próprio registro.

## Auditar e manter

Baixar um objeto:

```bash
npx wrangler r2 object get pulso-fotos/<chave> --remote --file saida.webp
```

Para inventários completos, use o painel R2 ou a API S3 compatível do R2 (com rclone ou aws-cli e um token R2 de leitura).

Antes de apagar objetos:

1. Confirme que nenhum registro no D1 aponta para a chave (`foto_url`).
2. Rode `SMOKE_BASE_URL=https://pulsoms.ia.br npm run smoke:public`.
