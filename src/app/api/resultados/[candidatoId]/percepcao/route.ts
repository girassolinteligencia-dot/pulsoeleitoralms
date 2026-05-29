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

function countPerfil(manifestacoes: { perfil: unknown }[], key: string) {
  const counts = new Map<string, number>();

  manifestacoes.forEach((manifestacao) => {
    const value = getPerfilString(manifestacao.perfil, key);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function leituraRapida(total: number, saldo: number) {
  if (total < 5) {
    return {
      titulo: 'Baixo volume de dados',
      descricao: 'Ainda ha poucas manifestacoes para formar uma leitura coletiva consistente.',
      tom: 'neutro',
    };
  }

  if (saldo >= 25) {
    return {
      titulo: 'Imagem positiva predominante',
      descricao: 'Entre as vozes registradas, a aprovacao supera a desaprovacao com folga.',
      tom: 'positivo',
    };
  }

  if (saldo <= -25) {
    return {
      titulo: 'Sinais de rejeicao elevados',
      descricao: 'Entre as vozes registradas, a desaprovacao aparece acima da aprovacao.',
      tom: 'negativo',
    };
  }

  return {
    titulo: 'Percepcao dividida',
    descricao: 'A leitura coletiva aparece equilibrada, sem vantagem forte de aprovacao ou desaprovacao.',
    tom: 'neutro',
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidatoId: string }> }
) {
  const { candidatoId } = await params;

  try {
    const manifestacoes = await prisma.manifestacao.findMany({
      where: {
        candidato_id: candidatoId,
        is_valid: true,
      },
      include: {
        avaliacoes: {
          where: {
            is_valid: true,
          },
          include: {
            atributo: true,
          },
        },
      },
      orderBy: {
        criado_em: 'desc',
      },
    });

    const vozesValidas = manifestacoes.length;
    const aprovacoes = manifestacoes.filter((manifestacao) => manifestacao.aprovacao === true).length;
    const desaprovacoes = manifestacoes.filter((manifestacao) => manifestacao.aprovacao === false).length;
    const expectativaVitoria = manifestacoes.filter((manifestacao) => manifestacao.expectativa_vitoria === true).length;
    const semRespostaAprovacao = vozesValidas - aprovacoes - desaprovacoes;

    const aprovacaoPct = percent(aprovacoes, vozesValidas);
    const desaprovacaoPct = percent(desaprovacoes, vozesValidas);
    const expectativaPct = percent(expectativaVitoria, vozesValidas);
    const saldoPercepcao = aprovacaoPct - desaprovacaoPct;

    const atributoCounts = new Map<string, { nome: string; total: number; valor: number }>();

    manifestacoes.forEach((manifestacao) => {
      manifestacao.avaliacoes.forEach((avaliacao) => {
        const current = atributoCounts.get(avaliacao.atributo_id) || {
          nome: avaliacao.atributo.nome,
          total: 0,
          valor: avaliacao.valor,
        };

        current.total += 1;
        atributoCounts.set(avaliacao.atributo_id, current);
      });
    });

    const atributos = Array.from(atributoCounts.values()).sort((a, b) => b.total - a.total);
    const forcas = atributos.filter((atributo) => atributo.valor > 0).slice(0, 3);
    const alertas = atributos.filter((atributo) => atributo.valor < 0).slice(0, 3);

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
      atributos: {
        forcas,
        alertas,
      },
      origem: {
        cidades: countPerfil(manifestacoes, 'cidade'),
        bairros: countPerfil(manifestacoes, 'bairro'),
      },
      aviso: 'Dados de manifestacoes espontaneas na plataforma. Nao representam pesquisa eleitoral registrada, amostra probabilistica ou margem de erro.',
    });
  } catch (error) {
    console.error('Error fetching perception results:', error);
    return NextResponse.json({
      resumo: {
        vozesValidas: 0,
        aprovacoes: 0,
        desaprovacoes: 0,
        semRespostaAprovacao: 0,
        expectativaVitoria: 0,
        aprovacaoPct: 0,
        desaprovacaoPct: 0,
        expectativaPct: 0,
        saldoPercepcao: 0,
      },
      leitura: leituraRapida(0, 0),
      atributos: {
        forcas: [],
        alertas: [],
      },
      origem: {
        cidades: [],
        bairros: [],
      },
      aviso: 'Dados de manifestacoes espontaneas na plataforma. Nao representam pesquisa eleitoral registrada, amostra probabilistica ou margem de erro.',
    });
  }
}

