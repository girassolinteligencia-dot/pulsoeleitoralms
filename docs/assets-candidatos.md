# Assets de Candidatos - PULSO ELEITORAL MS

## Decisão operacional

As fotos de candidatos devem ser servidas pelo **Supabase Storage**, bucket público `candidatos`.

O diretório local `public/candidatos` é tratado como acervo/importação e não deve ser enviado à Vercel. O arquivo `.vercelignore` mantém:

```text
public/candidatos/**
```

## Por que isso importa

O acervo local possui milhares de arquivos e centenas de MB. Publicar esses arquivos junto do app:

- aumenta o tempo de deploy;
- aumenta o risco de falha por limite de arquivos;
- torna o pacote da aplicação mais pesado;
- mistura código da plataforma com acervo de mídia.

## Como auditar

Execute:

```bash
npm run assets:audit
```

O relatório informa:

- quantidade de arquivos locais;
- tamanho total local;
- referências `foto_url` no banco;
- referências legadas `/candidatos/...`;
- URLs remotas já migradas;
- arquivos locais órfãos;
- referências sem arquivo local correspondente.

## Regra atual da aplicação

A API pública `/api/candidatos` resolve caminhos legados `/candidatos/arquivo.jpg` para:

```text
https://<projeto>.supabase.co/storage/v1/object/public/candidatos/arquivo.jpg
```

Assim o frontend não depende de `public/candidatos` em produção.

## Checklist antes de remover arquivos locais

1. Rodar `npm run assets:audit`.
2. Confirmar que as fotos necessárias existem no Supabase Storage.
3. Fazer backup do diretório local, se ele ainda for a única cópia.
4. Nunca remover `public/candidatos` sem confirmar a migração para Storage.
5. Rodar `npm run smoke` e `npm run smoke:public` após qualquer mudança.
