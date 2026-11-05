import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Sessão do admin: cookie HttpOnly assinado (HMAC-SHA256) com JWT_SECRET.
export const COOKIE_SESSAO = "pulso_admin";
export const DURACAO_SESSAO_S = 12 * 60 * 60; // 12 h

function segredo() {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "development")
    return "pulso-dev-only-admin-session-secret-000";
  throw new Error("JWT_SECRET ausente ou curto (mínimo 32 caracteres).");
}

type Sessao = { email: string; v: string; exp: number };

const assinar = (dados: string) =>
  createHmac("sha256", segredo()).update(dados).digest("base64url");

/** v = versão da senha (versaoSenha); trocar a senha derruba as sessões abertas. */
export function criarSessao(email: string, v: string) {
  const s: Sessao = { email, v, exp: Date.now() + DURACAO_SESSAO_S * 1000 };
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${assinar(payload)}`;
}

export function lerSessao(token: string | undefined | null): Sessao | null {
  if (!token || token.length > 2048) return null;
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;
  const esperado = Buffer.from(assinar(payload));
  const recebido = Buffer.from(assinatura);
  if (
    esperado.length !== recebido.length ||
    !timingSafeEqual(esperado, recebido)
  )
    return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof s.email !== "string" ||
      typeof s.v !== "string" ||
      typeof s.exp !== "number" ||
      Date.now() > s.exp
    )
      return null;
    return s as Sessao;
  } catch {
    return null;
  }
}

export function cookieDaRequisicao(req: Request) {
  const m = req.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${COOKIE_SESSAO}=([^;]+)`));
  return m?.[1];
}

/** HttpOnly + Secure + SameSite=Strict (cookie não viaja em requisições de outros sites). */
export function cookieSessao(valor: string, maxAge = DURACAO_SESSAO_S) {
  const secure = process.env.NODE_ENV === "development" ? "" : "; Secure";
  return `${COOKIE_SESSAO}=${valor}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
