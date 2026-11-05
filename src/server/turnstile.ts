import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Valida o token do Turnstile. Sem TURNSTILE_SECRET_KEY configurada a verificação
 * fica desativada (retorna ok) — útil em desenvolvimento; em produção o segredo é obrigatório.
 */
export async function verificarTurnstile(
  token: unknown,
  ip: string,
  action = "avaliar",
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, desativado: true as const };
  if (typeof token !== "string" || !token || token.length > 2048)
    return { ok: false, motivo: "token-ausente" };

  try {
    const body = new FormData();
    body.append("secret", secret);
    body.append("response", token);
    body.append("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as {
      success: boolean;
      action?: string;
      "error-codes"?: string[];
    };
    if (!data.success)
      return {
        ok: false,
        motivo: (data["error-codes"] || []).join(",") || "invalido",
      };
    if (data.action && data.action !== action)
      return { ok: false, motivo: "acao-divergente" };
    return { ok: true };
  } catch (e) {
    console.error("Falha ao validar Turnstile:", e);
    return { ok: false, motivo: "indisponivel" };
  }
}
