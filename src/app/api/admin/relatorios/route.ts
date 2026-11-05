import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNotNull, type SQL } from 'drizzle-orm';
import { getDb, type DB } from '@/server/db/client';
import { atributos as atributosT, avaliacoes, candidatos as candidatosT, manifestacoes as manifestacoesT, orgaosPublicos, servicosPublicos } from '@/server/db/schema';
import { startOfDay } from 'date-fns';
import { requireAdmin } from '@/lib/adminAuth';
import { resolveRodadaScope } from '@/server/repos/rodadaScope';

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

function summarizeAtributos(atributos: { count: number; polaridade: number }[]) {
  const positivos = atributos
    .filter((atributo) => atributo.polaridade === 1)
    .reduce((sum, atributo) => sum + atributo.count, 0);
  const negativos = atributos
    .filter((atributo) => atributo.polaridade === -1)
    .reduce((sum, atributo) => sum + atributo.count, 0);
  const total = positivos + negativos;

  return {
    total,
    positivos,
    negativos,
    positivoPct: pct(positivos, total),
    negativoPct: pct(negativos, total),
  };
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

type ColId = Parameters<typeof isNotNull>[0];
function categoriaCond(categoria: CategoriaFiltro, cols: { c: ColId; o: ColId; s: ColId }) {
  if (categoria === 'politico') return isNotNull(cols.c);
  if (categoria === 'orgao_publico') return isNotNull(cols.o);
  if (categoria === 'servico_publico') return isNotNull(cols.s);
  return undefined;
}

/** Agrupa linhas por chave, somando valor e contando (equivalente ao groupBy do Prisma). */
function agrupar<T>(rows: T[], key: (r: T) => string | null, valor: (r: T) => number = () => 0) {
  const m = new Map<string, { soma: number; total: number }>();
  for (const r of rows) {
    const k = key(r);
    if (k == null) continue;
    const cur = m.get(k) ?? { soma: 0, total: 0 };
    cur.soma += valor(r);
    cur.total += 1;
    m.set(k, cur);
  }
  return m;
}

/** Carrega avaliações e manifestações do recorte com os dados das entidades já juntados. */
async function carregarRecorte(db: DB, avWhere: SQL | undefined, manWhere: SQL | undefined) {
  const [avRows, manRows, atributosData] = await Promise.all([
    db
      .select({
        valor: avaliacoes.valor,
        criado_em: avaliacoes.criado_em,
        atributo_id: avaliacoes.atributo_id,
        candidato_id: avaliacoes.candidato_id,
        orgao_id: avaliacoes.orgao_id,
        servico_id: avaliacoes.servico_id,
        cNome: candidatosT.nome,
        cCargo: candidatosT.cargo,
        cPartido: candidatosT.partido,
        oNome: orgaosPublicos.nome,
        oTipo: orgaosPublicos.tipo,
        sNome: servicosPublicos.nome,
        sTipo: servicosPublicos.tipo,
      })
      .from(avaliacoes)
      .leftJoin(candidatosT, eq(candidatosT.id, avaliacoes.candidato_id))
      .leftJoin(orgaosPublicos, eq(orgaosPublicos.id, avaliacoes.orgao_id))
      .leftJoin(servicosPublicos, eq(servicosPublicos.id, avaliacoes.servico_id))
      .where(avWhere),
    db
      .select({
        perfil: manifestacoesT.perfil,
        aprovacao: manifestacoesT.aprovacao,
        expectativa_vitoria: manifestacoesT.expectativa_vitoria,
        candidato_id: manifestacoesT.candidato_id,
        cNome: candidatosT.nome,
      })
      .from(manifestacoesT)
      .leftJoin(candidatosT, eq(candidatosT.id, manifestacoesT.candidato_id))
      .where(manWhere),
    db.select({ id: atributosT.id, nome: atributosT.nome, polaridade: atributosT.polaridade }).from(atributosT),
  ]);
  return { avRows, manRows, atributosData };
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const dias = parseInt(searchParams.get('dias') || '30');
    const rodadaId = searchParams.get('rodadaId');
    const categoria = (searchParams.get('categoria') || 'todos') as CategoriaFiltro;
    const db = getDb();
    const scope = await resolveRodadaScope(db, { rodadaId, dias });

    if (rodadaId && !scope.rodada) {
      return NextResponse.json({ error: 'Rodada metodológica não encontrada' }, { status: 404 });
    }

    const { avRows, manRows, atributosData } = await carregarRecorte(
      db,
      and(scope.avaliacaoWhere, categoriaCond(categoria, { c: avaliacoes.candidato_id, o: avaliacoes.orgao_id, s: avaliacoes.servico_id })),
      and(scope.manifestacaoWhere, categoriaCond(categoria, { c: manifestacoesT.candidato_id, o: manifestacoesT.orgao_id, s: manifestacoesT.servico_id })),
    );
    const quer = (c: CategoriaFiltro) => categoria === 'todos' || categoria === c;
    type RawGroup = { _sum: { valor: number }; _count: { _all: number } };
    const toRaw = <K extends string>(m: Map<string, { soma: number; total: number }>, campo: K) =>
      [...m.entries()].map(([id, v]) => ({ [campo]: id, _sum: { valor: v.soma }, _count: { _all: v.total } }) as Record<K, string> & RawGroup);

    // 1. Ranking Líquido — todas as entidades
    const rankingCandRaw = quer('politico') ? toRaw(agrupar(avRows, (r) => r.candidato_id, (r) => r.valor), 'candidato_id') : [];
    const rankingOrgRaw = quer('orgao_publico') ? toRaw(agrupar(avRows, (r) => r.orgao_id, (r) => r.valor), 'orgao_id') : [];
    const rankingSvcRaw = quer('servico_publico') ? toRaw(agrupar(avRows, (r) => r.servico_id, (r) => r.valor), 'servico_id') : [];

    const unicos = <T extends { id: string }>(xs: (T | null)[]) =>
      [...new Map(xs.filter((x): x is T => !!x).map((x) => [x.id, x])).values()];
    const candidatos = unicos([
      ...avRows.map((r) => (r.candidato_id && r.cNome ? { id: r.candidato_id, nome: r.cNome, cargo: r.cCargo ?? '', partido: r.cPartido } : null)),
      ...manRows.map((r) => (r.candidato_id && r.cNome ? { id: r.candidato_id, nome: r.cNome, cargo: '', partido: null as string | null } : null)),
    ]);
    const orgaos = unicos(avRows.map((r) => (r.orgao_id && r.oNome ? { id: r.orgao_id, nome: r.oNome, tipo: r.oTipo ?? '' } : null)));
    const servicos = unicos(avRows.map((r) => (r.servico_id && r.sNome ? { id: r.servico_id, nome: r.sNome, tipo: r.sTipo ?? '' } : null)));
    const manifestacoes = manRows;

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
    const cargoRaw = avRows.map((r) => ({
      valor: r.valor,
      candidato: r.cCargo != null ? { cargo: r.cCargo } : null,
      orgao: r.oTipo != null ? { tipo: r.oTipo } : null,
      servico: r.sTipo != null ? { tipo: r.sTipo } : null,
    }));

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
    const temasRaw = [...agrupar(avRows, (r) => r.atributo_id).entries()]
      .map(([atributo_id, v]) => ({ atributo_id, _count: { _all: v.total } }))
      .sort((x, y) => y._count._all - x._count._all)
      .slice(0, 8);
    const atributos = atributosData;

    const temas = temasRaw.map(t => ({
      name: atributos.find(a => a.id === t.atributo_id)?.nome || 'Outro',
      value: t._count._all
    }));

    // 4. Tendência de Sentimento (Últimos 30 dias)
    const tendenciaRaw = avRows;

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
    const avAtributosRaw = [...agrupar(avRows, (r) => r.atributo_id).entries()].map(([atributo_id, v]) => ({ atributo_id, _count: { _all: v.total } }));

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

    const atributosResumo = summarizeAtributos(
      avAtributosRaw.map(av => {
        const attr = atributosData.find(a => a.id === av.atributo_id);
        return { count: av._count._all, polaridade: attr?.polaridade ?? 0 };
      })
    );

    // 9. Atributos por entidade (acordeão) — todas as categorias
    const porEntidadeAtributo = <K extends 'candidato_id' | 'orgao_id' | 'servico_id'>(campo: K) =>
      [...agrupar(avRows, (r) => (r[campo] ? r[campo] + '::' + r.atributo_id : null)).entries()].map(([k, v]) => {
        const [id, atributo_id] = k.split('::');
        return { [campo]: id, atributo_id, _count: { _all: v.total } } as Record<K, string> & { atributo_id: string; _count: { _all: number } };
      });
    const avPorCandAtrib = porEntidadeAtributo('candidato_id');
    const avPorOrgAtrib = porEntidadeAtributo('orgao_id');
    const avPorSvcAtrib = porEntidadeAtributo('servico_id');

    const buildAtributosEntidade = (entityId: string, rows: { atributo_id: string; _count: { _all: number } }[]) =>
      rows.map(av => {
        const attr = atributosData.find(a => a.id === av.atributo_id);
        return { nome: attr?.nome || 'N/A', count: av._count._all, polaridade: attr?.polaridade ?? 0 };
      }).sort((a, b) => b.count - a.count);

    const atributosPorCandidato = ranking.map(r => {
      let cargo = '';
      const tipoEntidade = r.tipo;

      if (r.tipo === 'politico') {
        const cand = candidatos.find(c => c.nome === r.nome);
        if (!cand) return null;
        cargo = cand.cargo;
        const atributos = buildAtributosEntidade(cand.id, avPorCandAtrib.filter(av => av.candidato_id === cand.id));
        const resumo = summarizeAtributos(atributos);
        return {
          candidatoId: cand.id,
          nome: cand.nome,
          cargo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos,
          atributosTotal: resumo.total,
          atributosPositivos: resumo.positivos,
          atributosNegativos: resumo.negativos,
          atributosPositivosPct: resumo.positivoPct,
          atributosNegativosPct: resumo.negativoPct,
        };
      } else if (r.tipo === 'orgao_publico') {
        const orgao = orgaos.find(o => o.nome === r.nome);
        if (!orgao) return null;
        const atributos = buildAtributosEntidade(orgao.id, avPorOrgAtrib.filter(av => av.orgao_id === orgao.id));
        const resumo = summarizeAtributos(atributos);
        return {
          candidatoId: orgao.id,
          nome: orgao.nome,
          cargo: orgao.tipo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos,
          atributosTotal: resumo.total,
          atributosPositivos: resumo.positivos,
          atributosNegativos: resumo.negativos,
          atributosPositivosPct: resumo.positivoPct,
          atributosNegativosPct: resumo.negativoPct,
        };
      } else {
        const svc = servicos.find(s => s.nome === r.nome);
        if (!svc) return null;
        const atributos = buildAtributosEntidade(svc.id, avPorSvcAtrib.filter(av => av.servico_id === svc.id));
        const resumo = summarizeAtributos(atributos);
        return {
          candidatoId: svc.id,
          nome: svc.nome,
          cargo: svc.tipo,
          tipoEntidade,
          totalVozes: r.total,
          liquidScore: r.liquidScore,
          atributos,
          atributosTotal: resumo.total,
          atributosPositivos: resumo.positivos,
          atributosNegativos: resumo.negativos,
          atributosPositivosPct: resumo.positivoPct,
          atributosNegativosPct: resumo.negativoPct,
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
      atributosResumo,
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
