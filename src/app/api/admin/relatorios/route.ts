import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import { requireAdmin } from '@/lib/adminAuth';
import { resolveRodadaScope } from '@/lib/rodadaScope';

function countProfileField(manifestacoes: { perfil: unknown }[], field: string) {
  const counts = new Map<string, number>();

  manifestacoes.forEach((manifestacao) => {
    if (!manifestacao.perfil || typeof manifestacao.perfil !== 'object') return;

    const perfil = manifestacao.perfil as Record<string, unknown>;
    const value = typeof perfil[field] === 'string' ? perfil[field].trim() : '';
    if (!value) return;

    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getPerfilString(perfil: unknown, field: string) {
  if (!perfil || typeof perfil !== 'object') return '';
  const value = (perfil as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : '';
}

function getPerfilNumber(perfil: unknown, field: string) {
  if (!perfil || typeof perfil !== 'object') return null;
  const value = (perfil as Record<string, unknown>)[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function buildTerritorialStats(
  manifestacoes: {
    perfil: unknown;
    aprovacao: boolean | null;
    expectativa_vitoria: boolean | null;
    candidato_id: string | null;
  }[],
  candidatoNomeById: Map<string, string>,
  field: 'cidade' | 'bairro',
) {
  const stats = new Map<string, {
    total: number;
    aprovacao: number;
    expectativa: number;
    candidatos: Map<string, number>;
  }>();

  for (const manifestacao of manifestacoes) {
    const name = getPerfilString(manifestacao.perfil, field);
    if (!name) continue;

    const current = stats.get(name) || {
      total: 0,
      aprovacao: 0,
      expectativa: 0,
      candidatos: new Map<string, number>(),
    };

    current.total++;
    if (manifestacao.aprovacao === true) current.aprovacao++;
    if (manifestacao.expectativa_vitoria === true) current.expectativa++;
    const cid = manifestacao.candidato_id ?? '';
    current.candidatos.set(cid, (current.candidatos.get(cid) || 0) + 1);
    stats.set(name, current);
  }

  return Array.from(stats.entries())
    .map(([name, item]) => {
      const [topCandidatoId, topCandidatoVozes] = Array.from(item.candidatos.entries())
        .sort((a, b) => b[1] - a[1])[0] || ['', 0];

      return {
        name,
        value: item.total,
        aprovacaoPct: pct(item.aprovacao, item.total),
        expectativaPct: pct(item.expectativa, item.total),
        topCandidato: topCandidatoId ? candidatoNomeById.get(topCandidatoId) || 'Desconhecido' : '',
        topCandidatoVozes,
      };
    })
    .sort((a, b) => b.value - a.value);
}

function buildCandidatoCidadeStats(
  manifestacoes: {
    perfil: unknown;
    aprovacao: boolean | null;
    expectativa_vitoria: boolean | null;
    candidato_id: string | null;
  }[],
  candidatoNomeById: Map<string, string>,
) {
  const stats = new Map<string, {
    cidade: string;
    candidato: string;
    manifestacoes: number;
    aprovacao: number;
    expectativa: number;
  }>();

  for (const manifestacao of manifestacoes) {
    const cidade = getPerfilString(manifestacao.perfil, 'cidade');
    if (!cidade) continue;

    const candidato = candidatoNomeById.get(manifestacao.candidato_id ?? '') || 'Desconhecido';
    const key = `${cidade}::${manifestacao.candidato_id ?? ''}`;
    const current = stats.get(key) || {
      cidade,
      candidato,
      manifestacoes: 0,
      aprovacao: 0,
      expectativa: 0,
    };

    current.manifestacoes++;
    if (manifestacao.aprovacao === true) current.aprovacao++;
    if (manifestacao.expectativa_vitoria === true) current.expectativa++;
    stats.set(key, current);
  }

  return Array.from(stats.values())
    .map((item) => ({
      cidade: item.cidade,
      candidato: item.candidato,
      manifestacoes: item.manifestacoes,
      aprovacaoPct: pct(item.aprovacao, item.manifestacoes),
      expectativaPct: pct(item.expectativa, item.manifestacoes),
    }))
    .sort((a, b) => b.manifestacoes - a.manifestacoes)
    .slice(0, 20);
}

type CategoriaFiltro = 'todos' | 'politico' | 'orgao_publico' | 'servico_publico';

function buildCategoriaWhere(categoria: CategoriaFiltro, base: Record<string, unknown>) {
  if (categoria === 'politico') return { ...base, candidato_id: { not: null } };
  if (categoria === 'orgao_publico') return { ...base, orgao_id: { not: null } };
  if (categoria === 'servico_publico') return { ...base, servico_id: { not: null } };
  return base;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const dias = parseInt(searchParams.get('dias') || '30');
    const rodadaId = searchParams.get('rodadaId');
    const categoria = (searchParams.get('categoria') || 'todos') as CategoriaFiltro;
    const scope = await resolveRodadaScope({ rodadaId, dias });

    if (rodadaId && !scope.rodada) {
      return NextResponse.json({ error: 'Rodada metodológica não encontrada' }, { status: 404 });
    }

    const avaliacaoWhere = buildCategoriaWhere(categoria, scope.avaliacaoWhere as Record<string, unknown>);
    const manifestacaoWhere = buildCategoriaWhere(categoria, scope.manifestacaoWhere as Record<string, unknown>);

    // 1. Ranking Líquido — todas as entidades
    const [rankingCandRaw, rankingOrgRaw, rankingSvcRaw] = await Promise.all([
      categoria === 'todos' || categoria === 'politico'
        ? prisma.avaliacao.groupBy({ by: ['candidato_id'], _sum: { valor: true }, _count: { _all: true }, where: { ...avaliacaoWhere, candidato_id: { not: null } } })
        : Promise.resolve([]),
      categoria === 'todos' || categoria === 'orgao_publico'
        ? prisma.avaliacao.groupBy({ by: ['orgao_id'], _sum: { valor: true }, _count: { _all: true }, where: { ...avaliacaoWhere, orgao_id: { not: null } } })
        : Promise.resolve([]),
      categoria === 'todos' || categoria === 'servico_publico'
        ? prisma.avaliacao.groupBy({ by: ['servico_id'], _sum: { valor: true }, _count: { _all: true }, where: { ...avaliacaoWhere, servico_id: { not: null } } })
        : Promise.resolve([]),
    ]);

    const [candidatos, orgaos, servicos] = await Promise.all([
      rankingCandRaw.length > 0
        ? prisma.candidato.findMany({ where: scope.rodada?.campanha_id ? { campanha_id: scope.rodada.campanha_id } : {}, select: { id: true, nome: true, cargo: true, partido: true } })
        : Promise.resolve([]),
      rankingOrgRaw.length > 0
        ? prisma.orgaoPublico.findMany({ select: { id: true, nome: true, tipo: true } })
        : Promise.resolve([]),
      rankingSvcRaw.length > 0
        ? prisma.servicoPublico.findMany({ select: { id: true, nome: true, tipo: true } })
        : Promise.resolve([]),
    ]);

    const candidatoNomeById = new Map(candidatos.map(c => [c.id, c.nome]));
    const orgaoNomeById = new Map(orgaos.map(o => [o.id, o.nome]));
    const servicoNomeById = new Map(servicos.map(s => [s.id, s.nome]));

    const toRankingItem = (nome: string, tipo: string, sum: number | null, count: number) => ({
      nome,
      tipo,
      score: sum || 0,
      total: count,
      liquidScore: Math.round(((sum || 0) / count) * 100),
    });

    const ranking = [
      ...rankingCandRaw.map(r => toRankingItem(candidatos.find(c => c.id === r.candidato_id)?.nome || 'Desconhecido', 'politico', r._sum.valor, r._count._all)),
      ...rankingOrgRaw.map(r => toRankingItem(orgaoNomeById.get(r.orgao_id ?? '') || 'Desconhecido', 'orgao_publico', r._sum.valor, r._count._all)),
      ...rankingSvcRaw.map(r => toRankingItem(servicoNomeById.get(r.servico_id ?? '') || 'Desconhecido', 'servico_publico', r._sum.valor, r._count._all)),
    ].sort((a, b) => b.liquidScore - a.liquidScore);

    // 2. Sentimento por Categoria/Cargo
    const cargoRaw = await prisma.avaliacao.findMany({
      where: avaliacaoWhere,
      include: {
        candidato: { select: { cargo: true } },
        orgao: { select: { tipo: true } },
        servico: { select: { tipo: true } },
      }
    });

    const cargoMap: Record<string, { apoio: number; neutro: number; rejeicao: number; total: number }> = {};
    cargoRaw.forEach(av => {
      const cargo = av.candidato?.cargo ?? av.orgao?.tipo ?? av.servico?.tipo ?? 'Outro';
      if (!cargoMap[cargo]) cargoMap[cargo] = { apoio: 0, neutro: 0, rejeicao: 0, total: 0 };
      if (av.valor > 0) cargoMap[cargo].apoio++;
      else if (av.valor < 0) cargoMap[cargo].rejeicao++;
      else cargoMap[cargo].neutro++;
      cargoMap[cargo].total++;
    });

    const cargoSentimento = Object.entries(cargoMap).map(([cargo, stats]) => ({
      cargo,
      apoio: Math.round((stats.apoio / stats.total) * 100),
      neutro: Math.round((stats.neutro / stats.total) * 100),
      rejeicao: Math.round((stats.rejeicao / stats.total) * 100),
    }));

    // 3. Temas (Atributos)
    const temasRaw = await prisma.avaliacao.groupBy({
      by: ['atributo_id'],
      _count: { _all: true },
      where: avaliacaoWhere,
      orderBy: { _count: { atributo_id: 'desc' } },
      take: 8
    });

    const atributos = await prisma.atributo.findMany({
      where: { id: { in: temasRaw.map(t => t.atributo_id) } },
      select: { id: true, nome: true }
    });

    const temas = temasRaw.map(t => ({
      name: atributos.find(a => a.id === t.atributo_id)?.nome || 'Outro',
      value: t._count._all
    }));

    // 4. Tendência de Sentimento (Últimos 30 dias)
    const tendenciaRaw = await prisma.avaliacao.findMany({
      where: avaliacaoWhere,
      select: { valor: true, criado_em: true }
    });

    const dailyStats: Record<string, { score: number; count: number }> = {};
    tendenciaRaw.forEach(av => {
      const day = startOfDay(av.criado_em).toISOString();
      if (!dailyStats[day]) dailyStats[day] = { score: 0, count: 0 };
      dailyStats[day].score += av.valor;
      dailyStats[day].count++;
    });

    const tendencia = Object.entries(dailyStats).map(([day, stats]) => ({
      dia: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: Math.round((stats.score / stats.count) * 100)
    })).sort((a, b) => {
        const [dA, mA] = a.dia.split('/').map(Number);
        const [dB, mB] = b.dia.split('/').map(Number);
        return mA !== mB ? mA - mB : dA - dB;
    });

    // 5. Visibilidade x Polarização (Scatter Plot)
    const polarizacao = ranking.map(r => {
      // Polarização simples: razão de discordância (mínimo entre pos/neg / máximo)
      // Aqui simplificamos para mostrar dispersão
      return {
        x: r.total, // Visibilidade
        y: Math.abs(r.liquidScore), // Intensidade do Sentimento
        z: r.total, // Tamanho da bolha
        nome: r.nome
      };
    });

    // 6. Dados Demográficos e de Aprovação (da tabela Manifestacao)
    const manifestacoes = await prisma.manifestacao.findMany({
      where: manifestacaoWhere,
      select: { perfil: true, aprovacao: true, expectativa_vitoria: true, candidato_id: true }
    });

    const demoStats: Record<string, Record<string, number>> = {
      sexo: {},
      escolaridade: {},
      ideologia: {},
      faixaSalarial: {}
    };

    let aprovacaoTotal = 0;
    let desaprovacaoTotal = 0;
    let expectativaVitoriaTotal = 0;

    manifestacoes.forEach(m => {
      if (m.aprovacao === true) aprovacaoTotal++;
      else if (m.aprovacao === false) desaprovacaoTotal++;
      
      if (m.expectativa_vitoria === true) expectativaVitoriaTotal++;

      if (m.perfil && typeof m.perfil === 'object') {
        const p = m.perfil as Record<string, string>;
        ['sexo', 'escolaridade', 'ideologia', 'faixaSalarial'].forEach(key => {
          if (p[key]) {
            demoStats[key][p[key]] = (demoStats[key][p[key]] || 0) + 1;
          }
        });
      }
    });

    const demografia = Object.entries(demoStats).map(([key, values]) => ({
      categoria: key,
      dados: Object.entries(values).map(([label, value]) => ({ label, value }))
    }));

    // 7. Distribuição territorial do respondente
    const cidades = countProfileField(manifestacoes, 'cidade');
    const bairros = countProfileField(manifestacoes, 'bairro');
    const cidadesDetalhadas = buildTerritorialStats(manifestacoes, candidatoNomeById, 'cidade').slice(0, 15);
    const bairrosDetalhados = buildTerritorialStats(manifestacoes, candidatoNomeById, 'bairro').slice(0, 15);
    const candidatoPorCidade = buildCandidatoCidadeStats(manifestacoes, candidatoNomeById);
    const withCidade = manifestacoes.filter((m) => getPerfilString(m.perfil, 'cidade')).length;
    const withBairro = manifestacoes.filter((m) => getPerfilString(m.perfil, 'bairro')).length;
    const withConfianca = manifestacoes.filter((m) => getPerfilNumber(m.perfil, 'bairroConfianca') !== null).length;
    const baixaConfianca = manifestacoes.filter((m) => {
      const value = getPerfilNumber(m.perfil, 'bairroConfianca');
      return value !== null && value < 0.8;
    }).length;

    // 8. Top Atributos (Virtudes vs Defeitos)
    const atributosData = await prisma.atributo.findMany({
      select: { id: true, nome: true, polaridade: true }
    });

    const avAtributosRaw = await prisma.avaliacao.groupBy({
      by: ['atributo_id'],
      _count: { _all: true },
      where: avaliacaoWhere
    });

    const virtudes = avAtributosRaw
      .map(av => {
        const attr = atributosData.find(a => a.id === av.atributo_id);
        return { nome: attr?.nome || 'N/A', count: av._count._all, polaridade: attr?.polaridade || 0 };
      })
      .filter(a => a.polaridade === 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const defeitos = avAtributosRaw
      .map(av => {
        const attr = atributosData.find(a => a.id === av.atributo_id);
        return { nome: attr?.nome || 'N/A', count: av._count._all, polaridade: attr?.polaridade || 0 };
      })
      .filter(a => a.polaridade === -1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Atributos por entidade (acordeão) — todas as categorias
    const [avPorCandAtrib, avPorOrgAtrib, avPorSvcAtrib] = await Promise.all([
      prisma.avaliacao.groupBy({ by: ['candidato_id', 'atributo_id'], _count: { _all: true }, where: { ...avaliacaoWhere, candidato_id: { not: null } } }),
      prisma.avaliacao.groupBy({ by: ['orgao_id', 'atributo_id'], _count: { _all: true }, where: { ...avaliacaoWhere, orgao_id: { not: null } } }),
      prisma.avaliacao.groupBy({ by: ['servico_id', 'atributo_id'], _count: { _all: true }, where: { ...avaliacaoWhere, servico_id: { not: null } } }),
    ]);

    const buildAtributosEntidade = (entityId: string, rows: { atributo_id: string; _count: { _all: number } }[]) =>
      rows.map(av => {
        const attr = atributosData.find(a => a.id === av.atributo_id);
        return { nome: attr?.nome || 'N/A', count: av._count._all, polaridade: attr?.polaridade ?? 0 };
      }).sort((a, b) => b.count - a.count);

    const atributosPorCandidato = ranking.map(r => {
      let entityId: string | undefined;
      let cargo = '';
      let tipoEntidade = r.tipo;

      if (r.tipo === 'politico') {
        const cand = candidatos.find(c => c.nome === r.nome);
        if (!cand) return null;
        entityId = cand.id;
        cargo = cand.cargo;
        return {
          candidatoId: cand.id,
          nome: cand.nome,
          cargo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos: buildAtributosEntidade(cand.id, avPorCandAtrib.filter(av => av.candidato_id === cand.id)),
        };
      } else if (r.tipo === 'orgao_publico') {
        const orgao = orgaos.find(o => o.nome === r.nome);
        if (!orgao) return null;
        return {
          candidatoId: orgao.id,
          nome: orgao.nome,
          cargo: orgao.tipo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos: buildAtributosEntidade(orgao.id, avPorOrgAtrib.filter(av => av.orgao_id === orgao.id)),
        };
      } else {
        const svc = servicos.find(s => s.nome === r.nome);
        if (!svc) return null;
        return {
          candidatoId: svc.id,
          nome: svc.nome,
          cargo: svc.tipo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos: buildAtributosEntidade(svc.id, avPorSvcAtrib.filter(av => av.servico_id === svc.id)),
        };
      }
    }).filter(Boolean);

    return NextResponse.json({
      categoria,
      ranking,
      cargoSentimento,
      temas,
      tendencia,
      polarizacao,
      demografia,
      cidades,
      bairros,
      territorio: {
        qualidade: {
          total: manifestacoes.length,
          comCidade: withCidade,
          comBairro: withBairro,
          comConfianca: withConfianca,
          baixaConfianca,
          cidadePct: pct(withCidade, manifestacoes.length),
          bairroPct: pct(withBairro, manifestacoes.length),
          confiancaPct: pct(withConfianca, manifestacoes.length),
          baixaConfiancaPct: pct(baixaConfianca, manifestacoes.length),
        },
        cidades: cidadesDetalhadas,
        bairros: bairrosDetalhados,
        candidatoPorCidade,
      },
      topAtributos: { virtudes, defeitos },
      atributosPorCandidato,
      aprovacao: {
        sim: aprovacaoTotal,
        nao: desaprovacaoTotal,
        expectativa: expectativaVitoriaTotal,
        total: manifestacoes.length
      },
      totalVotos: manifestacoes.length,
      totalAvaliacoes: tendenciaRaw.length,
      metodologia: {
        rodada: scope.rodada,
        periodo: {
          inicio: scope.startDate.toISOString(),
          fim: scope.endDate?.toISOString() || null,
        },
        aviso: scope.rodada?.tipo === 'pesquisa_registravel'
          ? 'Relatório filtrado por escopo metodológico registrável.'
          : 'Relatório de percepção pública espontânea, sem inferência representativa ou margem de erro.',
      }
    });

  } catch (error) {
    console.error('Error generating report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
