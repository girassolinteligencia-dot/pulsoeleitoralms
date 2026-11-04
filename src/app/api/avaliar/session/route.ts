import { NextRequest, NextResponse } from "next/server";
import { generateSecureHash } from "@/lib/hash";
import { createEvaluationSession } from "@/lib/evaluationSession";
import { getDb } from "@/server/db/client";
import { alvoDisponivel, type Alvo } from "@/server/repos/avaliacoes";
import { checkRateLimit } from "@/server/rateLimit";
import { clientIp } from "@/server/http";

const MENSAGEM_INDISPONIVEL: Record<Alvo["tipo"], string> = {
  candidato: "Candidato indisponível.",
  orgao: "Órgão indisponível.",
  servico: "Serviço indisponível.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidatoId, orgaoId, servicoId, fingerprint } = body;

    if (
      typeof fingerprint !== "string" ||
      fingerprint.length < 8 ||
      fingerprint.length > 512
    ) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const alvo: Alvo | null =
      typeof orgaoId === "string"
        ? { tipo: "orgao", id: orgaoId }
        : typeof servicoId === "string"
          ? { tipo: "servico", id: servicoId }
          : typeof candidatoId === "string"
            ? { tipo: "candidato", id: candidatoId }
            : null;
    if (!alvo)
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });

    const fingerprintHash = generateSecureHash(fingerprint);
    const [ipLimit, fpLimit] = await Promise.all([
      checkRateLimit(
        "RL_SESSAO",
        `ip:${generateSecureHash(clientIp(req.headers))}`,
      ),
      checkRateLimit("RL_SESSAO", `fp:${fingerprintHash}`),
    ]);
    if (!ipLimit.allowed || !fpLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas em curto período." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(ipLimit.retryAfter, fpLimit.retryAfter, 1),
            ),
          },
        },
      );
    }

    if (!(await alvoDisponivel(getDb(), alvo))) {
      return NextResponse.json(
        { error: MENSAGEM_INDISPONIVEL[alvo.tipo] },
        { status: 404 },
      );
    }

    return NextResponse.json(createEvaluationSession(alvo.id, fingerprintHash));
  } catch (error) {
    console.error("Erro ao criar sessão de avaliação:", error);
    return NextResponse.json(
      { error: "Erro interno ao iniciar avaliação." },
      { status: 500 },
    );
  }
}
