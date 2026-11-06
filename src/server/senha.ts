import "server-only";

// Hash de senha com PBKDF2-SHA256 (WebCrypto; 100 000 é o máximo aceito no Workers).
// Formato: pbkdf2$<iteracoes>$<salt b64url>$<hash b64url>. Mesmo formato do scripts/admin-senha.mjs.
const ITERACOES = 100_000;
export const SENHA_MIN = 10;

const enc = new TextEncoder();
const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64url");
const deB64 = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

async function derivar(senha: string, salt: Uint8Array, iter: number) {
  const chave = await crypto.subtle.importKey(
    "raw",
    enc.encode(senha),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations: iter,
    },
    chave,
    256,
  );
  return new Uint8Array(bits);
}

export function validarSenhaNova(senha: unknown): string | null {
  if (typeof senha !== "string" || senha.length < SENHA_MIN)
    return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha.length > 200) return "Senha longa demais.";
  return null;
}

export async function gerarHashSenha(senha: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERACOES}$${b64(salt)}$${b64(await derivar(senha, salt, ITERACOES))}`;
}

export async function conferirSenha(
  senha: string,
  armazenado: string | null | undefined,
) {
  const partes = (armazenado || "").split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") {
    await derivar(senha, new Uint8Array(16), ITERACOES); // tempo constante p/ usuário sem senha
    return false;
  }
  const iter = Number(partes[1]);
  if (!Number.isInteger(iter) || iter < 10_000 || iter > ITERACOES)
    return false;
  const esperado = deB64(partes[3]);
  const obtido = await derivar(senha, deB64(partes[2]), iter);
  if (esperado.length !== obtido.length) return false;
  let dif = 0;
  for (let i = 0; i < obtido.length; i++) dif |= obtido[i] ^ esperado[i];
  return dif === 0;
}

/** Impressão da senha atual: muda quando a senha muda e invalida sessões antigas. */
export async function versaoSenha(hash: string | null | undefined) {
  const d = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(hash || "sem-senha"),
  );
  return b64(new Uint8Array(d)).slice(0, 16);
}
