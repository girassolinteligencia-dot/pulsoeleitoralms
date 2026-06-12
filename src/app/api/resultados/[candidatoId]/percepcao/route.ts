import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type PerfilValue = Record<string, unknown>;

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function getPerfilString(perfil: unknown, key: string) {
  if (!perfil || typeof perfil !== 'object') return '';
  const value = (perfil as PerfilValue)[key];
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

function countPerfilComSaldo(
  manifestacoes: { perfil: unknown; aprovacao: boolean | null }[],
  key: string,
  limit = 5
) {
  const map = new Map<string, { total: number; aprovam: number; desaprovam: number }>();
  manifestacoes.forEach((m) => {
    const value = getPerfilString(m.perfil, key);
    if (!value) return;
    const cur = map.get(value) || { total: 0, aprovam: 0, desaprovam: 0 };
    cur.total += 1;
    if (m.aprovacao === true) cur.aprovam += 1;
    if (m.aprovacao === false) cur.desaprovam += 1;
    map.set(value, cur);
  });
  const totalGeral = manifestacoes.length;
  return Array.from(map.entries())
    .map(([nome, v]) => ({
      nome,
      total: v.total,
      pct: percent(v.total, totalGeral),
      saldo: v.aprovam - v.desaprovam,
      aprovamPct: percent(v.aprovam, v.total),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function leituraRapida(total: number, saldo: number) {
  if (total < 5) return { titulo: 'Baixo volume de dados', descricao: 'Ainda há poucas manifestações para formar uma leitura coletiva consistente.', tom: 'neutro' };
  if (saldo >= 25) return { titulo: 'Imagem positiva predominante', descricao: 'Entre as vozes registradas, a aprovação supera a desaprovação com folga.', tom: 'positivo' };
  if (saldo <= -25) return { titulo: 'Sinais de rejeição elevados', descricao: 'Entre as vozes registradas, a desaprovação aparece acima da aprovação.', tom: 'negativo' };
  return { titulo: 'Percepção dividida', descricao: 'A leitura coletiva aparece equilibrada, sem vantagem forte de aprovação ou desaprovação.', tom: 'neutro' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidatoId: string }> }
) {
  const { candidatoId } = await params;

  try {
    const agora = new Date();
    const inicio48h = new Date(agora.getTime() - 48 * 60 * 60 * 1000);

    const [manifestacoes, candidato, candidatosMesmoCargo] = await Promise.all([
      prisma.manifestacao.findMany({
        where: { candidato_id: candidatoId, is_valid: true },
        include: {
          avaliacoes: { where: { is_valid: true }, include: { atributo: true } },
        },
        orderBy: { criado_em: 'desc' },
      }),
      prisma.candidato.findUnique({
        where: { id: candidatoId },
        select: { cargo: true, campanha_id: true },
      }),
      // busca liquid scores de candidatos do mesmo cargo para comparativo
      prisma.avaliacao.groupBy({
        by: ['candidato_id'],
        _sum: { valor: true },
        _count: { _all: true },
        where: {
          is_valid: true,
          candidato: {
            cargo: (await prisma.candidato.findUnique({ where: { id: candidatoId }, select: { cargo: true } }))?.cargo ?? '',
          },
        },
      }),
    ]);

    const vozesValidas = manifestacoes.length;
    const aprovacoes = manifestacoes.filter(m => m.aprovacao === true).length;
    const desaprovacoes = manifestacoes.filter(m => m.aprovacao === false).length;
    const expectativaVitoria = manifestacoes.filter(m => m.expectativa_vitoria === true).length;
    const semRespostaAprovacao = vozesValidas - aprovacoes - desaprovacoes;

    const aprovacaoPct = percent(aprovacoes, vozesValidas);
    const desaprovacaoPct = percent(desaprovacoes, vozesValidas);
    const expectativaPct = percent(expectativaVitoria, vozesValidas);
    const saldoPercepcao = aprovacaoPct - desaprovacaoPct;

    // Atributos — histórico total
    const atributoCounts = new Map<string, { nome: string; total: number; valor: number; recente: number }>();
    const manifestacoesRecentes = new Set(
      manifestacoes.filter(m => new Date(m.criado_em) >= inicio48h).map(m => m.id)
    );

    manifestacoes.forEach(m => {
      m.avaliacoes.forEach(av => {
        const cur = atributoCounts.get(av.atributo_id) || { nome: av.atributo.nome, total: 0, valor: av.valor, recente: 0 };
        cur.total += 1;
        if (manifestacoesRecentes.has(m.id)) cur.recente += 1;
        atributoCounts.set(av.atributo_id, cur);
      });
    });

    const atributos = Array.from(atributoCounts.values())
      .sort((a, b) => b.total - a.total)
      .map(a => ({ ...a, pct: percent(a.total, vozesValidas) }));

    const forcas = atributos.filter(a => a.valor > 0).slice(0, 5);
    const alertas = atributos.filter(a => a.valor < 0).slice(0, 3);

    // Atributos em ascensão vs queda (48h vs histórico)
    const totalRecente = manifestacoes.filter(m => new Date(m.criado_em) >= inicio48h).length;
    const tendencias = Array.from(atributoCounts.values())
      .filter(a => a.total > 0 || a.recente > 0)
      .map(a => {
        const pctHistorico = percent(a.total, vozesValidas);
        const pctRecente = percent(a.recente, Math.max(totalRecente, 1));
        return { nome: a.nome, valor: a.valor, pctHistorico, pctRecente, delta: pctRecente - pctHistorico };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);

    // Mapa ideológico
    const ideologia = countPerfil(manifestacoes, 'ideologia', 5);

    // Perfil demográfico
    const demografico = {
      sexo: countPerfil(manifestacoes, 'sexo', 4),
      escolaridade: countPerfil(manifestacoes, 'escolaridade', 4),
      faixaSalarial: countPerfil(manifestacoes, 'faixaSalarial', 4),
      ocupacao: countPerfil(manifestacoes, 'ocupacao', 4),
    };

    // Força regional com saldo
    const regiaoComSaldo = {
      cidades: countPerfilComSaldo(manifestacoes, 'cidade', 5),
      bairros: countPerfilComSaldo(manifestacoes, 'bairro', 5),
    };

    // Comparativo de cargo
    const meuLiquid = (candidatosMesmoCargo.find(c => c.candidato_id === candidatoId)?._sum.valor ?? 0);
    const ranking = candidatosMesmoCargo
      .map(c => ({ id: c.candidato_id, liquid: c._sum.valor ?? 0, total: c._count._all }))
      .sort((a, b) => b.liquid - a.liquid);
    const posicaoCargo = ranking.findIndex(r => r.id === candidatoId) + 1;
    const totalCargo = ranking.length;

    return NextResponse.json({
      resumo: {
        vozesValidas,
        aprovacoes,
        desaprovacoes,
        semRespostaAprovacao,
        expectativaVitoria,
        aprovacaoPct,
        desaprovacaoPct,
        expectativaPct,
        saldoPercepcao,
      },
      leitura: leituraRapida(vozesValidas, saldoPercepcao),
      atributos: { forcas, alertas },
      tendencias,
      origem: regiaoComSaldo,
      ideologia,
      demografico,
      comparativoCargo: {
        cargo: candidato?.cargo ?? '',
        posicao: posicaoCargo,
        total: totalCargo,
        liquidScore: meuLiquid,
      },
      aviso: 'Dados de manifestações espontâneas na plataforma. Não representam pesquisa eleitoral registrada, amostra probabilística ou margem de erro. Os percentuais refletem o volume relativo de manifestações dentro da própria base.',
    });
  } catch (error) {
    console.error('Error fetching perception results:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
