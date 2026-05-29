import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity } from '@/lib/adminAuth';
import { resolveRodadaScope } from '@/lib/rodadaScope';
import { recordAuditLog } from '@/lib/auditLog';

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const rodadaId = searchParams.get('rodadaId');
    const diasParam = searchParams.get('dias');
    const dias = diasParam ? parseInt(diasParam) : undefined;
    const scopedExport = Boolean(rodadaId || diasParam);
    const scope = await resolveRodadaScope({ rodadaId, dias });

    if (rodadaId && !scope.rodada) {
      return NextResponse.json({ error: 'Rodada metodológica não encontrada' }, { status: 404 });
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: scopedExport ? scope.avaliacaoWhere : undefined,
      include: {
        candidato: true,
        atributo: true
      },
      orderBy: { criado_em: 'desc' }
    });

    // Generate CSV
    const headers = [
      'Rodada',
      'Tipo_Rodada',
      'Campanha',
      'Periodo_Inicio',
      'Periodo_Fim',
      'ID',
      'Candidato',
      'Cargo',
      'Partido',
      'Atributo',
      'Valor',
      'Data'
    ];
    const rows = avaliacoes.map(a => [
      scope.rodada?.titulo || '',
      scope.rodada?.tipo || '',
      scope.rodada?.campanha?.nome || a.candidato.cidade || '',
      scopedExport ? scope.startDate.toISOString() : '',
      scopedExport ? scope.endDate?.toISOString() || '' : '',
      a.id,
      a.candidato.nome,
      a.candidato.cargo,
      a.candidato.partido,
      a.atributo.nome,
      a.valor,
      a.criado_em.toISOString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(escapeCsvValue).join(','))
      .join('\n');

    await recordAuditLog({
      admin: auth,
      acao: 'EXPORT_CSV_GERADO',
      entidade: scope.rodada ? 'RodadaMetodologica' : 'Avaliacao',
      entidadeId: scope.rodada?.id || 'avaliacoes',
      detalhes: {
        rodada_id: scope.rodada?.id || null,
        dias: dias || null,
        total_linhas: rows.length,
        escopo_filtrado: scopedExport,
      },
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${scope.rodada ? `rodada_${scope.rodada.id}` : 'avaliacoes'}_pulso_eleitoral_ms.csv`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
