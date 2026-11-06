import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { checkRateLimit } from "@/server/rateLimit";
import { clientIp } from "@/server/http";
import {
  contarManifestacoesRecentes,
  existeBloqueioAtivo,
  registrarManifestacao,
  resolverRegrasDoAlvo,
  type Alvo,
} from "@/server/repos/avaliacoes";
import { generateSecureHash, isSuspiciousTiming } from "@/lib/hash";
import { verifyEvaluationSession } from "@/lib/evaluationSession";
import { verificarTurnstile } from "@/server/turnstile";

interface AvaliacaoInput {
  atributoId: string;
  valor: number;
}

function isValidAvaliacaoInput(value: unknown): value is AvaliacaoInput {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.atributoId === "string" &&
    (item.valor === 1 || item.valor === -1)
  );
}

const PERFIL_STRING_FIELDS = [
  "ideologia",
  "sexo",
  "cor",
  "faixaEtaria",
  "escolaridade",
  "estadoCivil",
  "faixaSalarial",
  "religiao",
  "ocupacao",
  "filhos",
  "orientacaoSexual",
  "deficiencia",
  "tempoResidencia",
  "cidade",
  "bairro",
  "uf",
  "localidadeOrigem",
] as const;

const TITLE_CASE_LOWER_WORDS = new Set(["da", "das", "de", "do", "dos", "e"]);

function normalizeTerritoryName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((part, index) => {
      if (index > 0 && TITLE_CASE_LOWER_WORDS.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1);
    })
    .join(" ")
    .slice(0, 120);
}

function sanitizePerfil(value: unknown) {
  const sanitized: Record<string, string | number | null> = {};
  if (!value || typeof value !== "object") return sanitized;

  const record = value as Record<string, unknown>;
  for (const field of PERFIL_STRING_FIELDS) {
    const fieldValue = record[field];
    if (typeof fieldValue === "string") {
      if (field === "cidade" || field === "bairro") {
        sanitized[field] = normalizeTerritoryName(fieldValue);
      } else if (field === "uf") {
        sanitized[field] = fieldValue
          .trim()
          .toLocaleUpperCase("pt-BR")
          .slice(0, 2);
      } else {
        sanitized[field] = fieldValue.trim().slice(0, 120);
      }
    }
  }

  const bairroConfianca = record.bairroConfianca;
  if (typeof bairroConfianca === "number" && Number.isFinite(bairroConfianca)) {
    sanitized.bairroConfianca = Math.max(0, Math.min(1, bairroConfianca));
  }

  return sanitized;
}

const asBoolOrNull = (v: unknown) => (typeof v === "boolean" ? v : null);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidatoId,
      orgaoId,
      servicoId,
      avaliacoes,
      fingerprint,
      sessionToken,
      honeypot,
      turnstileToken,
      perfil,
      aprovacao,
      expectativaVitoria,
    } = body;

    const alvo: Alvo | null =
      typeof orgaoId === "string"
        ? { tipo: "orgao", id: orgaoId }
        : typeof servicoId === "string"
          ? { tipo: "servico", id: servicoId }
          : typeof candidatoId === "string"
            ? { tipo: "candidato", id: candidatoId }
            : null;
    if (
      !alvo ||
      typeof fingerprint !== "string" ||
      typeof sessionToken !== "string" ||
      !Array.isArray(avaliacoes) ||
      avaliacoes.length === 0 ||
      avaliacoes.length > 50 ||
      !avaliacoes.every(isValidAvaliacaoInput)
    ) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }
    const itens = avaliacoes as AvaliacaoInput[];

    if (new Set(itens.map((av) => av.atributoId)).size !== itens.length) {
      return NextResponse.json(
        { error: "Atributos duplicados não são permitidos." },
        { status: 400 },
      );
    }

    const ip = clientIp(req.headers);
    const turnstile = await verificarTurnstile(turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json(
        {
          error:
            "Não foi possível confirmar que o envio é humano. Recarregue a página e tente de novo.",
        },
        { status: 403 },
      );
    }
    const ipHash = generateSecureHash(ip);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const fingerprintHash = generateSecureHash(fingerprint);

    const envio = await checkRateLimit("RL_ENVIO", `ip:${ipHash}`);
    if (!envio.allowed) {
      return NextResponse.json(
        { error: "Muitas manifestações em curto período." },
        { status: 429 },
      );
    }

    const evaluationSession = verifyEvaluationSession(sessionToken);
    if (
      !evaluationSession ||
      evaluationSession.candidatoId !== alvo.id ||
      evaluationSession.fingerprintHash !== fingerprintHash
    ) {
      return NextResponse.json(
        { error: "Sessão de avaliação inválida ou expirada." },
        { status: 400 },
      );
    }

    const endTime = Date.now();
    const duration = endTime - evaluationSession.startedAt;
    const db = getDb();

    const regras = await resolverRegrasDoAlvo(db, alvo);
    if (!regras) {
      const msg = {
        candidato: "Candidato",
        orgao: "Órgão",
        servico: "Serviço",
      }[alvo.tipo];
      return NextResponse.json(
        { error: `${msg} indisponível para avaliação.` },
        { status: 404 },
      );
    }
    if (itens.some((av) => !regras.atributosPermitidos.has(av.atributoId))) {
      return NextResponse.json(
        { error: "Atributo inválido para a campanha selecionada." },
        { status: 400 },
      );
    }

    if (await existeBloqueioAtivo(db, [ipHash, fingerprintHash])) {
      return NextResponse.json(
        { error: "Acesso bloqueado por segurança." },
        { status: 429 },
      );
    }
    if (
      (await contarManifestacoesRecentes(
        db,
        ipHash,
        fingerprintHash,
        new Date(Date.now() - 60_000),
      )) >= 10
    ) {
      return NextResponse.json(
        { error: "Muitas manifestações em curto período." },
        { status: 429 },
      );
    }

    const isBot = !!honeypot;
    const isValid =
      !isBot && !isSuspiciousTiming(evaluationSession.startedAt, endTime);

    await registrarManifestacao(db, {
      alvo,
      campanhaId: regras.campanhaId,
      aprovacao: asBoolOrNull(aprovacao),
      expectativaVitoria: asBoolOrNull(expectativaVitoria),
      perfil: sanitizePerfil(perfil),
      fingerprintHash,
      ipHash,
      userAgent,
      durationMs: duration,
      isValid,
      isBot,
      plataforma: req.headers.get("sec-ch-ua-platform") || "unknown",
      itens: itens.map((i) => ({
        atributoId: i.atributoId,
        valor: i.valor as 1 | -1,
      })),
    });

    return NextResponse.json({
      success: true,
      status: isValid ? "confirmed" : "flagged",
    });
  } catch (error) {
    console.error("Erro ao processar voz:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento da manifestação." },
      { status: 500 },
    );
  }
}
