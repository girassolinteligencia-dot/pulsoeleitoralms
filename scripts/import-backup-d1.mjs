// Converte o backup JSON do Supabase em SQL para o D1 e (opcionalmente) aplica.
// Uso: node scripts/import-backup-d1.mjs <dir-backup> <saida.sql> [--apply=local|remote]
//
// Regras:
//  - Datas -> epoch ms; booleanos -> 0/1; JSON -> texto.
//  - Candidatos: importa somente os referenciados por avaliações/manifestações
//    (o restante vem do pipeline TSE). sq_candidato é extraído de foto_url (cand-<sq>.webp).
//  - Fotos legadas: foto_url vira chave R2 "legado/<bucket>/<arquivo>".
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [dir, outFile, applyArg] = process.argv.slice(2);
if (!dir || !outFile) {
  console.error(
    "Uso: node scripts/import-backup-d1.mjs <dir-backup> <saida.sql> [--apply=local|remote]",
  );
  process.exit(1);
}
const load = async (t) =>
  JSON.parse(await readFile(path.join(dir, "db", `${t}.json`), "utf8"));

const DATE_COLS = new Set([
  "last_calc_at",
  "data_inicio",
  "data_fim",
  "criado_em",
  "atualizado_em",
  "expira_em",
  "ultimo_login_em",
  "updatedAt",
  "importado_em",
  "periodo_inicio",
  "periodo_fim",
]);
const JSON_COLS = new Set([
  "meta_config",
  "perfil",
  "device_info",
  "geo_location",
  "detalhes",
  "valor_json",
  "localidades",
  "plano_amostral",
  "ponderacao",
  "questionario",
]);

function lit(col, v, table) {
  if (v === null || v === undefined) return "NULL";
  if (DATE_COLS.has(col)) return String(new Date(v).getTime());
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (
    JSON_COLS.has(col) ||
    (table === "parametros_plataforma" && col === "valor") ||
    typeof v === "object"
  ) {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function inserts(table, rows, cols) {
  const out = [];
  for (const r of rows) {
    const c = cols ?? Object.keys(r);
    out.push(
      `INSERT INTO "${table}" (${c.map((x) => `"${x}"`).join(",")}) VALUES (${c.map((x) => lit(x, r[x], table)).join(",")});`,
    );
  }
  return out;
}

const fotoKey = (bucket, url) => {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) {
    const m = url.match(/\/object\/public\/([^/]+)\/(.+)$/);
    return m ? `legado/${m[1]}/${m[2]}` : url;
  }
  return `legado/${bucket}/${url.replace(new RegExp(`^${bucket}/`), "")}`;
};

const sql = ["PRAGMA defer_foreign_keys = ON;"];
const report = {};

const campanhas = await load("campanhas");
const atributos = await load("atributos");
const campAtrib = await load("campanha_atributos");
const candidatos = await load("candidatos");
const orgaos = await load("orgaos_publicos");
const servicos = await load("servicos_publicos");
const manifestacoes = await load("manifestacoes");
const avaliacoes = await load("avaliacoes");

const ref = new Set(
  [...manifestacoes, ...avaliacoes].map((x) => x.candidato_id).filter(Boolean),
);
const candSel = candidatos
  .filter((c) => ref.has(c.id))
  .map((c) => {
    // cand-<sq>.webp (storage) ou FMS<sq>_div.jpg (arquivo TSE ausente -> foto nula)
    const sq = (c.foto_url || "").match(/(?:cand-|FMS)(\d+)/)?.[1] ?? null;
    if (/FMS\d+_div\.jpg$/.test(c.foto_url || "")) c = { ...c, foto_url: null };
    return {
      ...c,
      foto_url: fotoKey("candidatos", c.foto_url),
      sq_candidato: sq,
      fonte: "legado",
    };
  });

const plan = [
  ["campanhas", campanhas],
  ["atributos", atributos],
  ["campanha_atributos", campAtrib],
  ["candidatos", candSel],
  [
    "orgaos_publicos",
    orgaos.map((o) => ({ ...o, foto_url: fotoKey("orgaos", o.foto_url) })),
  ],
  [
    "servicos_publicos",
    servicos.map((s) => ({ ...s, foto_url: fotoKey("servicos", s.foto_url) })),
  ],
  ["manifestacoes", manifestacoes],
  ["avaliacoes", avaliacoes],
  ["bloqueios", await load("bloqueios")],
  ["audit_logs", await load("audit_logs")],
  ["admin_users", await load("admin_users")],
  ["parametros_plataforma", await load("parametros_plataforma")],
  ["ceps_ms", await load("ceps_ms")],
  ["rodadas_metodologicas", await load("rodadas_metodologicas")],
];
for (const [t, rows] of plan) {
  sql.push(`DELETE FROM "${t}";`);
  sql.push(...inserts(t, rows));
  report[t] = rows.length;
}
// D1 executa o arquivo na ordem; DELETEs antes dos INSERTs dependentes já estão garantidos pela ordem de plan,
// mas para reexecução segura apagamos filhos primeiro:
const deletes = plan.map(([t]) => `DELETE FROM "${t}";`).reverse();
const body = sql.filter((l) => !l.startsWith("DELETE FROM"));
await writeFile(
  outFile,
  [body[0], ...deletes, ...body.slice(1)].join("\n") + "\n",
);
console.table(report);
console.log(`SQL gerado: ${outFile}`);

if (applyArg?.startsWith("--apply=")) {
  const target = applyArg.split("=")[1];
  execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "pulso-db",
      `--${target}`,
      "--file",
      outFile,
      "--yes",
    ],
    {
      stdio: "inherit",
      shell: true,
    },
  );
}
