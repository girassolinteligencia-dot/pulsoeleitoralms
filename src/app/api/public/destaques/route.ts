import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFotoUrl } from '@/lib/fotoUrl';

export async function GET() {
  try {
    const params = await prisma.parametroPlataforma.findMany({
      where: { chave: { in: ['destaques_orgaos', 'destaques_servicos'] } },
    });

    const orgaoIds = (params.find(p => p.chave === 'destaques_orgaos')?.valor ?? []) as string[];
    const servicoIds = (params.find(p => p.chave === 'destaques_servicos')?.valor ?? []) as string[];

    const [orgaos, servicos] = await Promise.all([
      orgaoIds.length > 0
        ? prisma.orgaoPublico.findMany({
            where: { id: { in: orgaoIds }, status: 'Ativo' },
            select: { id: true, nome: true, tipo: true, cidade: true, foto_url: true },
          })
        : Promise.resolve([]),
      servicoIds.length > 0
        ? prisma.servicoPublico.findMany({
            where: { id: { in: servicoIds }, status: 'Ativo' },
            select: { id: true, nome: true, tipo: true, cidade: true, foto_url: true },
          })
        : Promise.resolve([]),
    ]);

    // Preserva a ordem definida pelo admin
    const orgaosOrdenados = orgaoIds.flatMap(id => {
      const orgao = orgaos.find(o => o.id === id);
      return orgao ? [{ ...orgao, foto_url: getFotoUrl(orgao.foto_url) }] : [];
    });

    const servicosOrdenados = servicoIds.flatMap(id => {
      const servico = servicos.find(s => s.id === id);
      return servico ? [{ ...servico, foto_url: getFotoUrl(servico.foto_url) }] : [];
    });

    return NextResponse.json(
      { orgaos: orgaosOrdenados, servicos: servicosOrdenados },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch {
    return NextResponse.json({ orgaos: [], servicos: [] }, { status: 500 });
  }
}
