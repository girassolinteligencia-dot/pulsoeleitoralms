# Importação de candidaturas do TSE

Os candidatos da plataforma vêm dos **dados abertos oficiais do TSE** (cdn.tse.jus.br / portal CKAN de dados abertos). Escopo atual: **Mato Grosso do Sul, eleições de 2024 (municipais) e 2026 (gerais)**.

## Fontes

| Arquivo                                                  | Conteúdo                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `odsele/consulta_cand/consulta_cand_<ANO>.zip`           | CSV de candidaturas por UF (`consulta_cand_<ANO>_MS.csv`, latin1, separador `;`) |
| `eleicoes/eleicoes<ANO>/fotos/foto_cand<ANO>_MS_div.zip` | Fotos `FMS<SQ_CANDIDATO>_div.jpg`                                                |

Base: `https://cdn.tse.jus.br/estatistica/sead/`.

## Regras aplicadas

- Uma linha por `SQ_CANDIDATO`; no 2º turno vale o resultado final.
- Vices (prefeito/governador) e suplentes de senador ficam de fora: concorrem na chapa do titular. Ajuste em `CARGOS_EXCLUIDOS` em `scripts/tse/importar.mjs`.
- Eleições suplementares do ciclo entram (ex.: Bandeirantes e Paranhos em 2024).
- `id = cand-<SQ_CANDIDATO>`: reimportar atualiza o registro (upsert), sem duplicar e sem perder avaliações.
- Gravados: nome de urna e nome completo, número, partido, cargo, município, código TSE do município, situação da candidatura e resultado (`situacao_totalizacao`: ELEITO, ELEITO POR QP, ELEITO POR MÉDIA, SUPLENTE, NÃO ELEITO).
- **LGPD:** CPF, título de eleitor, e-mail, data de nascimento, gênero, raça, estado civil, instrução e ocupação **não** são importados.
- Fotos: convertidas para WebP (até 400×533) e gravadas no R2 em `candidatos/<ANO>/<SQ>.webp`, servidas pelo site em `/fotos/...`.

## Como reimportar

```bash
# 1) baixar e extrair numa pasta fora do repositório
#    cand<ANO>/consulta_cand_<ANO>_MS.csv  e  foto<ANO>/FMS*_div.jpg
# 2) conferir sem gravar
node scripts/tse/importar.mjs --dir <pasta> --anos 2024,2026 --dry-run
# 3) importar (D1 e R2 de produção, via bindings remotos do Wrangler)
npm run tse:importar -- --dir <pasta> --anos 2024,2026
```

Opções: `--local` grava no D1/R2 locais do `wrangler dev`; `--sem-fotos` atualiza só os dados. Fotos já enviadas são puladas.

Requer `npx wrangler login` com acesso à conta Cloudflare do projeto.
