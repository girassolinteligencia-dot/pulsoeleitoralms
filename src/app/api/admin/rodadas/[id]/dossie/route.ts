import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity } from '@/lib/adminAuth';
import { resolveRodadaScope } from '@/lib/rodadaScope';
import { recordAuditLog } from '@/lib/auditLog';

type SegmentData = {
  params: Promise<{ id: string }>;
};

function safeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  if (typeof value === 'object') return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  return escapeHtml(value);
}

function renderMetric(label: string, value: unknown) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? '0')}</strong>
    </div>
  `;
}

function renderDossieHtml(dossie: any) {
  const metodologia = dossie.metodologia_declarada || {};
  const indicadores = dossie.indicadores_de_qualidade || {};
  const atributos = Array.isArray(dossie.atributos_mais_frequentes) ? dossie.atributos_mais_frequentes : [];

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dossiê Metodológico - ${escapeHtml(dossie.rodada?.titulo)}</title>
  <style>
    :root { color-scheme: light; --ink:#1f1b17; --muted:#71665d; --line:#ddd4ca; --brand:#c4633d; --soft:#f7f2ec; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: var(--ink); background: #fff; line-height: 1.55; }
    main { max-width: 980px; margin: 0 auto; padding: 48px 32px 72px; }
    header { border-bottom: 3px solid var(--brand); padding-bottom: 28px; margin-bottom: 32px; }
    .eyebrow { color: var(--brand); font-size: 11px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; }
    h1 { margin: 10px 0 8px; font-size: 34px; line-height: 1.08; text-transform: uppercase; }
    h2 { margin: 0 0 16px; font-size: 15px; letter-spacing: .18em; text-transform: uppercase; }
    h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--brand); }
    p { margin: 0; color: var(--muted); }
    section { border: 1px solid var(--line); border-radius: 8px; padding: 24px; margin: 18px 0; page-break-inside: avoid; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .metric { background: var(--soft); border: 1px solid var(--line); border-radius: 8px; padding: 16px; min-height: 92px; }
    .metric span { display: block; color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 8px; font-size: 26px; }
    dl { display: grid; grid-template-columns: 220px 1fr; gap: 10px 18px; margin: 0; }
    dt { color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    dd { margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
    th { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
    pre { white-space: pre-wrap; word-break: break-word; background: var(--soft); border: 1px solid var(--line); border-radius: 8px; padding: 14px; font-size: 12px; }
    .notice { background: #fff8f3; border-color: #e8c8b8; }
    footer { margin-top: 32px; color: var(--muted); font-size: 11px; border-top: 1px solid var(--line); padding-top: 18px; }
    @media print { main { max-width: none; padding: 24px; } section { break-inside: avoid; } }
    @media (max-width: 760px) { main { padding: 28px 18px; } .grid, dl { grid-template-columns: 1fr; } h1 { font-size: 26px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">${escapeHtml(dossie.plataforma)} · Dossiê Metodológico</div>
      <h1>${escapeHtml(dossie.rodada?.titulo)}</h1>
      <p>Gerado em ${escapeHtml(new Date(dossie.gerado_em).toLocaleString('pt-BR'))}</p>
    </header>

    <section>
      <h2>Identificação</h2>
      <dl>
        <dt>Tipo</dt><dd>${escapeHtml(dossie.rodada?.tipo)}</dd>
        <dt>Status</dt><dd>${escapeHtml(dossie.rodada?.status)}</dd>
        <dt>Campanha</dt><dd>${escapeHtml(dossie.rodada?.campanha?.nome || 'Sem campanha vinculada')}</dd>
        <dt>Período considerado</dt><dd>${formatValue(dossie.escopo_operacional?.inicio_considerado)} até ${formatValue(dossie.escopo_operacional?.fim_considerado)}</dd>
        <dt>Regra operacional</dt><dd>${formatValue(dossie.escopo_operacional?.regra)}</dd>
      </dl>
    </section>

    <section>
      <h2>Indicadores de Qualidade</h2>
      <div class="grid">
        ${renderMetric('Candidatos no escopo', indicadores.candidatos_ativos_no_escopo)}
        ${renderMetric('Manifestações válidas', indicadores.manifestacoes_validas)}
        ${renderMetric('Manifestações inválidas', indicadores.manifestacoes_invalidas)}
        ${renderMetric('Taxa de invalidação', `${indicadores.taxa_invalidacao_percentual || 0}%`)}
      </div>
    </section>

    <section>
      <h2>Metodologia Declarada</h2>
      <dl>
        <dt>Objetivo</dt><dd>${formatValue(metodologia.objetivo)}</dd>
        <dt>Público-alvo</dt><dd>${formatValue(metodologia.publico_alvo)}</dd>
        <dt>Abrangência</dt><dd>${formatValue(metodologia.abrangencia)}</dd>
        <dt>Tamanho da amostra</dt><dd>${formatValue(metodologia.tamanho_amostra)}</dd>
        <dt>Margem de erro</dt><dd>${metodologia.margem_erro ? `${escapeHtml(metodologia.margem_erro)}%` : 'Não informado'}</dd>
        <dt>Nível de confiança</dt><dd>${metodologia.nivel_confianca ? `${escapeHtml(metodologia.nivel_confianca)}%` : 'Não informado'}</dd>
        <dt>Plano amostral</dt><dd>${formatValue(metodologia.plano_amostral)}</dd>
        <dt>Ponderação</dt><dd>${formatValue(metodologia.ponderacao)}</dd>
        <dt>Questionário</dt><dd>${formatValue(metodologia.questionario)}</dd>
        <dt>Observações</dt><dd>${formatValue(metodologia.observacoes)}</dd>
      </dl>
    </section>

    <section>
      <h2>Atributos Mais Frequentes</h2>
      <table>
        <thead><tr><th>Atributo</th><th>Polaridade</th><th>Total</th></tr></thead>
        <tbody>
          ${atributos.map((item: any) => `
            <tr>
              <td>${escapeHtml(item.nome)}</td>
              <td>${escapeHtml(item.polaridade ?? 'n/a')}</td>
              <td>${escapeHtml(item.total)}</td>
            </tr>
          `).join('') || '<tr><td colspan="3">Sem dados suficientes.</td></tr>'}
        </tbody>
      </table>
    </section>

    <section class="notice">
      <h2>Enquadramento de Comunicação</h2>
      <h3>${formatValue(dossie.enquadramento?.comunicacao)}</h3>
      <p>${formatValue(dossie.enquadramento?.restricao)}</p>
    </section>

    <footer>
      PULSO ELEITORAL MS · Artefato técnico gerado automaticamente para auditoria metodológica.
    </footer>
  </main>
</body>
</html>`;
}

export async function GET(req: NextRequest, segmentData: SegmentData) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await segmentData.params;
    const scope = await resolveRodadaScope({ rodadaId: id });

    if (!scope.rodada) {
      return NextResponse.json({ error: 'Rodada metodológica não encontrada' }, { status: 404 });
    }

    const invalidManifestacaoWhere = {
      ...scope.manifestacaoWhere,
      is_valid: false,
    };
    const invalidAvaliacaoWhere = {
      ...scope.avaliacaoWhere,
      is_valid: false,
    };

    const [
      manifestacoesValidas,
      manifestacoesInvalidas,
      avaliacoesValidas,
      avaliacoesInvalidas,
      candidatosAtivos,
      atributosRaw,
    ] = await Promise.all([
      prisma.manifestacao.count({ where: scope.manifestacaoWhere }),
      prisma.manifestacao.count({ where: invalidManifestacaoWhere }),
      prisma.avaliacao.count({ where: scope.avaliacaoWhere }),
      prisma.avaliacao.count({ where: invalidAvaliacaoWhere }),
      prisma.candidato.count({ where: scope.candidatoWhere }),
      prisma.avaliacao.groupBy({
        by: ['atributo_id'],
        where: scope.avaliacaoWhere,
        _count: { _all: true },
        orderBy: { _count: { atributo_id: 'desc' } },
        take: 10,
      }),
    ]);

    const atributos = await prisma.atributo.findMany({
      where: { id: { in: atributosRaw.map((item) => item.atributo_id) } },
      select: { id: true, nome: true, polaridade: true },
    });
    const totalManifestacoes = manifestacoesValidas + manifestacoesInvalidas;
    const taxaInvalidacao = totalManifestacoes
      ? Number(((manifestacoesInvalidas / totalManifestacoes) * 100).toFixed(2))
      : 0;

    const dossie = {
      gerado_em: new Date().toISOString(),
      plataforma: 'PULSO ELEITORAL MS',
      rodada: {
        id: scope.rodada.id,
        titulo: scope.rodada.titulo,
        tipo: scope.rodada.tipo,
        status: scope.rodada.status,
        campanha: scope.rodada.campanha,
        periodo_inicio: scope.rodada.periodo_inicio,
        periodo_fim: scope.rodada.periodo_fim,
      },
      escopo_operacional: {
        inicio_considerado: scope.startDate,
        fim_considerado: scope.endDate,
        campanha_id: scope.rodada.campanha_id,
        regra: 'Filtros por campanha vinculada, período de campo e registros válidos.',
      },
      indicadores_de_qualidade: {
        candidatos_ativos_no_escopo: candidatosAtivos,
        manifestacoes_validas: manifestacoesValidas,
        manifestacoes_invalidas: manifestacoesInvalidas,
        avaliacoes_validas: avaliacoesValidas,
        avaliacoes_invalidas: avaliacoesInvalidas,
        taxa_invalidacao_percentual: taxaInvalidacao,
      },
      atributos_mais_frequentes: atributosRaw.map((item) => {
        const atributo = atributos.find((candidate) => candidate.id === item.atributo_id);
        return {
          id: item.atributo_id,
          nome: atributo?.nome || 'Atributo não encontrado',
          polaridade: atributo?.polaridade ?? null,
          total: item._count._all,
        };
      }),
      metodologia_declarada: {
        objetivo: null,
        publico_alvo: null,
        abrangencia: null,
        tamanho_amostra: null,
        margem_erro: null,
        nivel_confianca: null,
        plano_amostral: null,
        ponderacao: null,
        questionario: null,
        observacoes: null,
      },
      enquadramento: scope.rodada.tipo === 'pesquisa_registravel'
        ? {
            comunicacao: 'Pesquisa registrável quando houver plano amostral, questionário, ponderação e responsável técnico.',
            restricao: 'Validar exigências legais e metodológicas antes de divulgação externa.',
          }
        : {
            comunicacao: 'Percepção pública espontânea.',
            restricao: 'Não declarar margem de erro, intenção de voto, empate técnico ou representatividade estatística.',
          },
    };

    const rodadaCompleta = await prisma.rodadaMetodologica.findUnique({
      where: { id },
      select: {
        objetivo: true,
        publico_alvo: true,
        abrangencia: true,
        tamanho_amostra: true,
        margem_erro: true,
        nivel_confianca: true,
        plano_amostral: true,
        ponderacao: true,
        questionario: true,
        observacoes: true,
      },
    });

    const dossieCompleto = {
      ...dossie,
      metodologia_declarada: rodadaCompleta,
    };

    const wantsHtml = req.nextUrl.searchParams.get('format') === 'html';
    const body = wantsHtml
      ? renderDossieHtml(dossieCompleto)
      : JSON.stringify(dossieCompleto, null, 2);

    await recordAuditLog({
      admin: auth,
      acao: 'DOSSIE_GERADO',
      entidade: 'RodadaMetodologica',
      entidadeId: scope.rodada.id,
      detalhes: {
        titulo: scope.rodada.titulo,
        tipo: scope.rodada.tipo,
        formato: wantsHtml ? 'html' : 'json',
        manifestacoes_validas: manifestacoesValidas,
        avaliacoes_validas: avaliacoesValidas,
      },
    });

    return new NextResponse(body, {
      headers: {
        'Content-Type': wantsHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename=dossie_${safeFilename(scope.rodada.titulo || scope.rodada.id)}.${wantsHtml ? 'html' : 'json'}`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar dossiê metodológico:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar dossiê' }, { status: 500 });
  }
}
