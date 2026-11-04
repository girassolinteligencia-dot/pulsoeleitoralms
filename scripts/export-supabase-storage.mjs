// Retoma o download do Storage (pula arquivos existentes). Uso: node scripts/export-supabase-storage.mjs <dir-backup>
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env.production.local", ".env"], quiet: true });
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(process.argv[2]);
const storageDir = path.join(outDir, "storage");
const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const manifestPath = path.join(outDir, "manifest.json");
let manifest = { storage: {} };
try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); manifest.storage ??= {}; } catch {}

try {
  const buckets = await prisma.$queryRawUnsafe(`select id, name, public from storage.buckets order by name`);
  for (const b of buckets) {
    let objs;
    try {
      objs = await prisma.$queryRawUnsafe(`select name from storage.objects where bucket_id = '${b.id.replace(/'/g, "''")}' order by name`);
    } catch (e) { console.log(`st  ${b.name}: ERRO ao listar: ${e.message.split("\n").pop()}`); continue; }
    let ok = 0, skip = 0; const failed = [];
    const queue = [...objs];
    await Promise.all(Array.from({ length: 8 }, async () => {
      for (let o; (o = queue.shift()); ) {
        const dest = path.join(storageDir, b.name, o.name);
        try { await access(dest); skip++; continue; } catch {}
        const url = `${base}/storage/v1/object/public/${b.name}/${o.name.split("/").map(encodeURIComponent).join("/")}`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!res.ok) throw new Error(String(res.status));
          await mkdir(path.dirname(dest), { recursive: true });
          await writeFile(dest, Buffer.from(await res.arrayBuffer()));
          ok++;
        } catch (e) { failed.push({ name: o.name, error: e.message }); }
      }
    }));
    manifest.storage[b.name] = { public: b.public, files: objs.length, downloaded: ok + skip, failed };
    console.log(`st  ${b.name.padEnd(24)} ${ok + skip}/${objs.length} (novos ${ok}, falhas ${failed.length})${b.public ? "" : " [privado]"}`);
  }
} finally { await prisma.$disconnect(); }
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
