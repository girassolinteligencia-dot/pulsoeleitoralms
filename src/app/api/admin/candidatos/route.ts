import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET candidates for admin with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = {
      ano_eleicao: { in: [2022, 2024] },
      ...(search && {
        nome: {
          contains: search,
          mode: 'insensitive' as const,
        }
      }),
    };

    const [candidatos, total] = await Promise.all([
      prisma.candidato.findMany({
        where,
        include: { campanha: true },
        orderBy: { nome: 'asc' },
        take: limit,
        skip,
      }),
      prisma.candidato.count({ where }),
    ]);

    return NextResponse.json({
      data: candidatos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar candidatos admin:', error);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 }, { status: 200 });
  }
}

// POST create a new candidate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, partido, numero, cargo, cidade, bairro, foto_url, campanha_id } = body;
    const candidato = await prisma.candidato.create({
      data: {
        nome,
        partido,
        numero,
        cargo,
        cidade,
        bairro,
        foto_url,
        campanha_id
      }
    });

    return NextResponse.json(candidato);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// PATCH update a candidate
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nome, partido, numero, cargo, cidade, foto_url } = body;
    
    const candidato = await prisma.candidato.update({
      where: { id },
      data: {
        nome,
        partido,
        numero,
        cargo,
        cidade,
        foto_url
      }
    });

    return NextResponse.json(candidato);
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
