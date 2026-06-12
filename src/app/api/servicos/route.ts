import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFotoUrl } from '@/lib/supabase';
import { buildSearchOR } from '@/lib/normalize-search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();

  try {
    const [servicos, atributosGlobais] = await Promise.all([
      prisma.servicoPublico.findMany({
        where: {
          status: 'Ativo',
          ...(search && { OR: buildSearchOR(search, ['nome', 'tipo', 'cidade']) }),
        },
        include: {
          campanha: {
            select: {
              atributos: {
                select: {
                  atributo: {
                    select: { id: true, nome: true, polaridade: true },
                  },
                },
                where: { atributo: { visivel: true } },
              },
            },
          },
        },
        orderBy: [{ cidade: 'asc' }, { nome: 'asc' }],
        take: 50,
      }),
      prisma.atributo.findMany({
        where: { visivel: true, categoria: 'servico' },
        select: { id: true, nome: true, polaridade: true },
        orderBy: [{ polaridade: 'desc' }, { nome: 'asc' }],
      }),
    ]);

    // Fallback: entidades sem campanha ou com campanha sem atributos recebem todos os atributos visíveis
    const fallback = atributosGlobais.map(a => ({ atributo: a }));
    const result = servicos.map(s => {
      const temAtributos = (s.campanha?.atributos?.length ?? 0) > 0;
      const base = { ...s, foto_url: getFotoUrl(s.foto_url) };
      if (temAtributos) return base;
      return { ...base, campanha: { atributos: fallback } };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar serviços públicos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
