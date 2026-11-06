// Define (ou redefine) a senha de um admin direto no D1 remoto.
// Uso: npm run admin:senha -- email@dominio.com
// A senha é digitada sem eco no terminal e só o hash PBKDF2 vai ao banco.
// Se o e-mail não existir, cria o usuário como "admin" ativo.
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const email = (process.argv[2] || "").toLowerCase().trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Uso: npm run admin:senha -- email@dominio.com");
  process.exit(1);
}

function lerSenha(pergunta) {
  return new Promise((resolve) => {
    process.stdout.write(pergunta);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let s = "";
    const on = (ch) => {
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off("data", on);
        process.stdout.write("\n");
        resolve(s);
      } else if (ch === "\u0003") process.exit(130);
      else if (ch === "\u0008" || ch === "\u007f") s = s.slice(0, -1);
      else s += ch;
    };
    stdin.on("data", on);
  });
}

const senha = await lerSenha("Nova senha (mín. 10): ");
if (senha.length < 10) {
  console.error("Senha curta demais.");
  process.exit(1);
}
if ((await lerSenha("Repita a senha: ")) !== senha) {
  console.error("As senhas não conferem.");
  process.exit(1);
}

const iter = 100000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(senha, salt, iter, 32, "sha256");
const valor = `pbkdf2$${iter}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const agora = Date.now();

const sql = `INSERT INTO admin_users (id, email, role, ativo, senha_hash, criado_em, atualizado_em)
VALUES (${q(randomUUID())}, ${q(email)}, 'admin', 1, ${q(valor)}, ${agora}, ${agora})
ON CONFLICT(email) DO UPDATE SET senha_hash = excluded.senha_hash, ativo = 1, atualizado_em = ${agora};`;

const arq = join(tmpdir(), `admin-senha-${process.pid}.sql`);
writeFileSync(arq, sql);
try {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "pulso-db", "--remote", "--file", arq],
    {
      stdio: ["ignore", "ignore", "inherit"],
      shell: process.platform === "win32",
    },
  );
  console.log(`Senha definida para ${email}.`);
} finally {
  unlinkSync(arq);
}
