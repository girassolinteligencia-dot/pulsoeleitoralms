// Exporta todas as tabelas do schema public e todos os buckets do Supabase Storage
// para um diretório FORA do repositório. Não imprime credenciais.
// Uso: node scripts/export-supabase.mjs [diretorio-destino]
import dotenv from "dotenv";
dotenv.config({
  path: [".env.local", ".env.production.local", ".env"],
  quiet: true,
});
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const outDir = path.resolve(
  process.argv[2] ?? `../.PULSOELEITORAL-backup/supabase-${stamp}`,
);
const dbDir = path.join(outDir, "db");
const storageDir = path.join(outDir, "storage");
await mkdir(dbDir, { recursive: true });
await mkdir(storageDir, { recursive: true });

const replacer = (_k, v) => (typeof v === "bigint" ? v.toString() : v);
const manifest = {
  exported_at: new Date().toISOString(),
  tables: {},
  storage: {},
};

// ---------- Banco ----------
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || process.env.DIRECT_URL },
  },
});
try {
  const tables = await prisma.$queryRawUnsafe(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`,
  );
  for (const { table_name } of tables) {
    const rows = await prisma.$queryRawUnsafe(
      `select * from public."${table_name}"`,
    );
    await writeFile(
      path.join(dbDir, `${table_name}.json`),
      JSON.stringify(rows, replacer),
    );
    manifest.tables[table_name] = rows.length;
    console.log(`db  ${table_name.padEnd(28)} ${rows.length}`);
  }
  // Schema (colunas) para referência na conversão para D1
  const cols = await prisma.$queryRawUnsafe(
    `select table_name, column_name, data_type, is_nullable, column_default
     from information_schema.columns where table_schema = 'public'
     order by table_name, ordinal_position`,
  );
  await writeFile(
    path.join(dbDir, "_columns.json"),
    JSON.stringify(cols, replacer, 2),
  );

  // ---------- Storage (via storage.objects + URL pública, sem service key) ----------
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const buckets = await prisma.$queryRawUnsafe(
    `select id, name, public from storage.buckets order by name`,
  );
  for (const b of buckets) {
    const objs = await prisma.$queryRawUnsafe(
      `select name from storage.objects where bucket_id = $1 order by name`,
      b.id,
    );
    let ok = 0;
    const failed = [];
    for (const { name } of objs) {
      const url = `${base}/storage/v1/object/public/${b.name}/${name.split("/").map(encodeURIComponent).join("/")}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        const dest = path.join(storageDir, b.name, name);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, Buffer.from(await res.arrayBuffer()));
        ok++;
      } catch (e) {
        failed.push({ name, error: e.message });
      }
    }
    manifest.storage[b.name] = { public: b.public, files: objs.length, downloaded: ok, failed };
    console.log(`st  ${b.name.padEnd(28)} ${ok}/${objs.length}${b.public ? "" : " (bucket privado)"}`);
  }
} finally {
  await prisma.$disconnect();
}

await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nBackup salvo em: ${outDir}`);
