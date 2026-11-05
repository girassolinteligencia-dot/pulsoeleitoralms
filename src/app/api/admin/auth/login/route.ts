import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isSameOrigin } from "@/lib/adminAuth";
import { getDb } from "@/server/db/client";
import { adminUsers } from "@/server/db/schema";
import { checkRateLimit } from "@/server/rateLimit";
import { clientIp } from "@/server/http";
import { criarSessao, cookieSessao } from "@/server/adminSession";
import { conferirSenha, versaoSenha } from "@/server/senha";
import { recordAuditLog } from "@/lib/auditLog";

const INVALIDO = "E-mail ou senha inválidos.";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req))
    return NextResponse.json(
      { error: "Origem não permitida" },
      { status: 403 },
    );

  let body: { email?: unknown; senha?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: INVALIDO }, { status: 400 });
  }
  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const senha = typeof body.senha === "string" ? body.senha : "";
  if (!email || !senha || email.length > 254 || senha.length > 200)
    return NextResponse.json({ error: INVALIDO }, { status: 400 });

  // Força bruta: limite por IP e por e-mail (10 tentativas/min cada).
  const ip = clientIp(req.headers);
  for (const key of [`login-ip:${ip}`, `login-email:${email}`]) {
    const rl = await checkRateLimit("RL_ENVIO", key);
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um minuto." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  const ok = await conferirSenha(senha, user?.senha_hash);
  if (!user || !user.ativo || !ok)
    return NextResponse.json({ error: INVALIDO }, { status: 401 });

  await db
    .update(adminUsers)
    .set({ ultimo_login_em: new Date() })
    .where(eq(adminUsers.id, user.id));
  await recordAuditLog({
    admin: {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: "viewer",
      adminUserId: user.id,
    },
    acao: "ADMIN_LOGIN",
    entidade: "AdminUser",
    entidadeId: user.id,
    detalhes: { email: user.email },
  }).catch(() => {});

  const token = criarSessao(user.email, await versaoSenha(user.senha_hash));
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": cookieSessao(token),
        "Cache-Control": "no-store",
      },
    },
  );
}
