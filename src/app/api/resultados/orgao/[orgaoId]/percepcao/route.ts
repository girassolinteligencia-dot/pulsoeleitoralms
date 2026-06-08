import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function getPerfilString(perfil: unknown, key: string) {
  if (!perfil || typeof perfil !== 'object') return '';
  const value = (perfil as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

function countPerfil(manifestacoes: { perfil: unknown }[], key: string, limit = 5) {
  const counts = new Map<string, number>();
  manifestacoes.forEach((m) => {
    const value = getPerfilString(m.perfil, key);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  const total = manifestacoes.length;
  return Array.from(counts.entries())
    .map(([nome, count]) => ({ nome, total: count, pct: percent(count, total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function leituraRapida(total: number, saldo: number) {
  if (total < 5) return { titulo: 'Baixo volume de dados', descricao: 'Ainda há poucas manifestações para uma leitura coletiva consistente.', tom: 'neutro' };
  if (saldo >= 25) return { titulo: 'Avaliação positiva predominante', descricao: 'Entre as vozes registradas, a aprovação supera a desaprovação com folga.', tom: 'positivo' };
  if (saldo <= -25) return { titulo: 'Sinais de insatisfação elevados', descricao: 'Entre as vozes registradas, a desaprovação aparece acima da aprovação.', tom: 'negativo' };
  return { titulo: 'Percepção dividida', descricao: 'A leitura coletiva aparece equilibrada, sem vantagem forte de aprovação ou desaprovação.', tom: 'neutro' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgaoId: string }> }
) {
  const { orgaoId } = await params;

  try {
    const agora = new Date();
    const inicio48h = new Date(agora.getTime() - 48 * 60 * 60 * 1000);

    const [manifestacoes, orgao] = await Promise.all([
      prisma.manifestacao.findMany({
        where: { orgao_id: orgaoId, is_valid: true },
        include: {
          avaliacoes: { where: { is_valid: true }, include: { atributo: true } },
        },
        orderBy: { criado_em: 'desc' },
      }),
      prisma.orgaoPublico.findUnique({
        where: { id: orgaoId },
        select: { tipo: true, nome: true },
      }),
    ]);

    const vozesValidas = manifestacoes.length;
    const aprovacoes = manifestacoes.filter((m) => m.aprovacao === true).length;
    const desaprovacoes = manifestacoes.filter((m) => m.aprovacao === false).length;
    // expectativa_vitoria reutilizado como "Confia neste órgão?"
    const confianca = manifestacoes.filter((m) => m.expectativa_vitoria === true).length;
    const semRespostaAprovacao = vozesValidas - aprovacoes - desaprovacoes;

    const aprovacaoPct = percent(aprovacoes, vozesValidas);
    const desaprovacaoPct = percent(desaprovacoes, vozesValidas);
    const confiancaPct = percent(confianca, vozesValidas);
    const saldoPercepcao = aprovacaoPct - desaprovacaoPct;

    // Atributos
    const atributoCounts = new Map<string, { nome: string; total: number; saldo: number; recente: number }>();
    const manifestacoesRecentes = new Set(
      manifestacoes.filter((m) => new Date(m.criado_em) >= inicio48h).map((m) => m.id)
    );

    manifestacoes.forEach((m) => {
      m.avaliacoes.forEach((av) => {
        const cur = atributoCounts.get(av.atributo_id) || { nome: av.atributo.nome, total: 0, saldo: 0, recente: 0 };
        cur.total += 1;
        cur.saldo += av.valor;
        if (manifestacoesRecentes.has(m.id)) cur.recente += 1;
        atributoCounts.set(av.atributo_id, cur);
      });
    });

    const atributos = Array.from(atributoCounts.values())
      .sort((a, b) => b.total - a.total)
      .map((a) => ({ ...a, valor: a.saldo, pct: percent(a.total, vozesValidas) }));

    const forcas = atributos.filter((a) => a.saldo > 0).slice(0, 5);
    const alertas = atributos.filter((a) => a.saldo < 0).slice(0, 3);

    const totalRecente = manifestacoes.filter((m) => new Date(m.criado_em) >= inicio48h).length;
    const tendencias = Array.from(atributoCounts.values())
      .filter((a) => a.total > 0 || a.recente > 0)
      .map((a) => {
        const pctHistorico = percent(a.total, vozesValidas);
        const pctRecente = percent(a.recente, Math.max(totalRecente, 1));
        return { nome: a.nome, valor: a.saldo, pctHistorico, pctRecente, delta: pctRecente - pctHistorico };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);

    const ideologia = countPerfil(manifestacoes, 'ideologia', 5);
    const demografico = {
      sexo: countPerfil(manifestacoes, 'sexo', 4),
      escolaridade: countPerfil(manifestacoes, 'escolaridade', 4),
      faixaSalarial: countPerfil(manifestacoes, 'faixaSalarial', 4),
      ocupacao: countPerfil(manifestacoes, 'ocupacao', 4),
    };

    return NextResponse.json({
      resumo: {
        vozesValidas,
        aprovacoes,
        desaprovacoes,
        semRespostaAprovacao,
        confianca,
        aprovacaoPct,
        desaprovacaoPct,
        confiancaPct,
        saldoPercepcao,
      },
      leitura: leituraRapida(vozesValidas, saldoPercepcao),
      atributos: { forcas, alertas },
      tendencias,
      ideologia,
      demografico,
      aviso: 'Dados de manifestações espontâneas na plataforma. Não representam pesquisa registrada, amostra probabilística ou margem de erro.',
    });
  } catch (error) {
    console.error('Erro ao buscar percepção do órgão:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
