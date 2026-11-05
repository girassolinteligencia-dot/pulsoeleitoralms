// Importa candidaturas e fotos oficiais do TSE (CKAN / cdn.tse.jus.br) para o D1 e o R2.
//
// Uso:
//   node scripts/tse/importar.mjs --dir <pasta extraída> --anos 2024,2026 [--local] [--sem-fotos] [--dry-run]
//
// A pasta deve conter cand<ANO>/consulta_cand_<ANO>_MS.csv e foto<ANO>/FMS<sq>_div.jpg
// (extraídos de consulta_cand_<ANO>.zip e foto_cand<ANO>_MS_div.zip).
//
// LGPD: CPF, título de eleitor, e-mail, data de nascimento e demais dados pessoais do CSV
// são descartados; só entram dados públicos de candidatura e o resultado oficial.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getPlatformProxy } from "wrangler";
import { lerCsvTse, limpo } from "./ler-csv.mjs";

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const flag = (n) => args.includes(`--${n}`);

const DIR = arg("dir");
const ANOS = (arg("anos", "2024,2026") || "").split(",").map(Number);
const LOCAL = flag("local");
const SEM_FOTOS = flag("sem-fotos");
const DRY = flag("dry-run");
if (!DIR) {
  console.error("Informe --dir <pasta extraída>");
  process.exit(1);
}

// Vices e suplentes concorrem na chapa do titular (não recebem voto próprio).
const CARGOS_EXCLUIDOS = new Set([
  "VICE-PREFEITO",
  "VICE-GOVERNADOR",
  "1º SUPLENTE",
  "2º SUPLENTE",
]);
const SLUG_CAMPANHA = { 2024: "ms-2024", 2026: "ms-2026" };

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function carregarCandidaturas(ano) {
  const csv = path.join(DIR, `cand${ano}`, `consulta_cand_${ano}_MS.csv`);
  const rows = lerCsvTse(csv).filter(
    (r) => r.SG_UF === "MS" && !CARGOS_EXCLUIDOS.has(r.DS_CARGO),
  );
  // Uma linha por SQ_CANDIDATO; no 2º turno vale o resultado final (maior NR_TURNO).
  const porSq = new Map();
  for (const r of rows) {
    const atual = porSq.get(r.SQ_CANDIDATO);
    if (!atual || Number(r.NR_TURNO) > Number(atual.NR_TURNO))
      porSq.set(r.SQ_CANDIDATO, r);
  }
  return [...porSq.values()];
}

function paraRegistro(r, ano, campanhaId, temFoto) {
  const sq = r.SQ_CANDIDATO;
  const nomeUrna = limpo(r.NM_URNA_CANDIDATO) || limpo(r.NM_CANDIDATO);
  const nomeCompleto = limpo(r.NM_CANDIDATO) || nomeUrna;
  const nome =
    nomeUrna === nomeCompleto ? nomeUrna : `${nomeUrna} (${nomeCompleto})`;
  const municipal = r.TP_ABRANGENCIA === "MUNICIPAL" || ano % 4 === 0;
  const cidade = municipal ? limpo(r.NM_UE) : "MATO GROSSO DO SUL";
  const partido = limpo(r.SG_PARTIDO);
  const cargo = limpo(r.DS_CARGO);
  return {
    id: `cand-${sq}`,
    nome,
    nome_urna: nomeUrna,
    partido,
    numero: limpo(r.NR_CANDIDATO),
    cargo,
    cidade,
    ano_eleicao: ano,
    campanha_id: campanhaId,
    sq_candidato: sq,
    cd_municipio_tse: municipal ? limpo(r.SG_UE) : null,
    situacao_candidatura: limpo(r.DS_SITUACAO_CANDIDATURA),
    situacao_totalizacao: limpo(r.DS_SIT_TOT_TURNO),
    foto_url: temFoto ? `candidatos/${ano}/${sq}.webp` : null,
    busca: norm(
      [nomeUrna, nomeCompleto, cargo, partido, cidade]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

async function emLotes(itens, tamanho, fn) {
  for (let i = 0; i < itens.length; i += tamanho)
    await fn(itens.slice(i, i + tamanho), i);
}

async function main() {
  const proxy = LOCAL
    ? await getPlatformProxy({ configPath: "wrangler.jsonc" })
    : await getPlatformProxy({
        configPath: "scripts/tse/wrangler.import.jsonc",
      });
  const { DB, FOTOS } = proxy.env;

  try {
    const campanhas = (await DB.prepare("select id, slug from campanhas").all())
      .results;
    const idPorSlug = Object.fromEntries(campanhas.map((c) => [c.slug, c.id]));

    for (const ano of ANOS) {
      const campanhaId = idPorSlug[SLUG_CAMPANHA[ano]];
      if (!campanhaId)
        throw new Error(`Campanha ${SLUG_CAMPANHA[ano]} não encontrada`);

      const rows = carregarCandidaturas(ano);
      const fotoDir = path.join(DIR, `foto${ano}`);
      const fotoDe = (sq) =>
        ["jpg", "jpeg", "JPG"]
          .map((e) => path.join(fotoDir, `FMS${sq}_div.${e}`))
          .find(existsSync);

      const registros = rows.map((r) =>
        paraRegistro(r, ano, campanhaId, !!fotoDe(r.SQ_CANDIDATO)),
      );
      const comFoto = registros.filter((r) => r.foto_url).length;
      console.log(
        `\n${ano}: ${registros.length} candidaturas, ${comFoto} com foto (campanha ${SLUG_CAMPANHA[ano]})`,
      );
      if (DRY) {
        console.log(registros.slice(0, 3));
        continue;
      }

      // 1) Fotos → WebP no R2 (pula as já enviadas)
      if (!SEM_FOTOS) {
        let enviadas = 0,
          puladas = 0,
          falhas = 0;
        const fila = registros.filter((r) => r.foto_url);
        await Promise.all(
          Array.from({ length: 8 }, async () => {
            for (let r; (r = fila.shift());) {
              try {
                if (await FOTOS.head(r.foto_url)) {
                  puladas++;
                  continue;
                }
                const webp = await sharp(readFileSync(fotoDe(r.sq_candidato)))
                  .rotate()
                  .resize({
                    width: 400,
                    height: 533,
                    fit: "inside",
                    withoutEnlargement: true,
                  })
                  .webp({ quality: 80 })
                  .toBuffer();
                await FOTOS.put(r.foto_url, webp, {
                  httpMetadata: { contentType: "image/webp" },
                });
                enviadas++;
              } catch (e) {
                falhas++;
                r.foto_url = null; // não referenciar foto que não subiu
                console.error(`  foto ${r.sq_candidato}: ${e.message}`);
              }
              const n = enviadas + puladas + falhas;
              if (n % 500 === 0) console.log(`  fotos: ${n}/${comFoto}`);
            }
          }),
        );
        console.log(
          `  fotos: ${enviadas} enviadas, ${puladas} já existiam, ${falhas} falhas`,
        );
      }

      // 2) Upsert no D1 (lotes; cada statement com 16 parâmetros)
      const cols = [
        "id",
        "nome",
        "nome_urna",
        "partido",
        "numero",
        "cargo",
        "cidade",
        "ano_eleicao",
        "campanha_id",
        "sq_candidato",
        "cd_municipio_tse",
        "situacao_candidatura",
        "situacao_totalizacao",
        "foto_url",
        "busca",
      ];
      const upd = cols
        .filter((c) => c !== "id")
        .map((c) => `${c}=excluded.${c}`)
        .join(", ");
      const sql = `insert into candidatos (${cols.join(", ")}, fonte, status, atualizado_tse_em)
        values (${cols.map(() => "?").join(", ")}, 'tse_ckan', 'Ativo', ?)
        on conflict(id) do update set ${upd}, fonte='tse_ckan', atualizado_tse_em=excluded.atualizado_tse_em`;
      const agora = Date.now();
      await emLotes(registros, 100, async (lote, i) => {
        await DB.batch(
          lote.map((r) =>
            DB.prepare(sql).bind(...cols.map((c) => r[c] ?? null), agora),
          ),
        );
        if ((i / 100) % 10 === 0)
          console.log(`  d1: ${i + lote.length}/${registros.length}`);
      });
      console.log(`  d1: ${registros.length} candidaturas gravadas`);
    }
  } finally {
    await proxy.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
