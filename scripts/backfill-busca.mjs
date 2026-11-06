// Preenche a coluna `busca` (texto normalizado) em candidatos/órgãos/serviços.
// Uso: node scripts/backfill-busca.mjs --local|--remote
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const target = process.argv[2] === "--remote" ? "--remote" : "--local";
const norm = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
const q = (sql) =>
  JSON.parse(execFileSync("npx", ["wrangler", "d1", "execute", "pulso-db", target, "--json", "--command", JSON.stringify(sql)], { encoding: "utf8", shell: true, maxBuffer: 1 << 28 }))[0].results;
const esc = (s) => `'${s.replace(/'/g, "''")}'`;

const updates = [];
for (const r of q("select id, nome, cargo, partido, cidade, nome_urna from candidatos"))
  updates.push(`UPDATE candidatos SET busca=${esc(norm([r.nome, r.nome_urna, r.cargo, r.partido, r.cidade].filter(Boolean).join(" ")))} WHERE id=${esc(r.id)};`);
for (const t of ["orgaos_publicos", "servicos_publicos"])
  for (const r of q(`select id, nome, tipo, cidade from ${t}`))
    updates.push(`UPDATE ${t} SET busca=${esc(norm([r.nome, r.tipo, r.cidade].filter(Boolean).join(" ")))} WHERE id=${esc(r.id)};`);

const file = path.join(mkdtempSync(path.join(tmpdir(), "busca-")), "busca.sql");
writeFileSync(file, updates.join("\n"));
execFileSync("npx", ["wrangler", "d1", "execute", "pulso-db", target, "--file", file, "--yes"], { stdio: "ignore", shell: true });
console.log(`busca atualizada em ${updates.length} registros (${target})`);
