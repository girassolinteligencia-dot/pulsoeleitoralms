import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/atributos
 * Retorna todos os atributos cadastrados (incluindo os ocultos, para o admin).
 */
export async function GET() {
  try {
    const atributos = await prisma.atributo.findMany({
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(atributos);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar atributos' }, { status: 500 });
  }
}

/**
 * POST /api/admin/atributos
 * Cria um novo atributo.
 */
export async function POST(req: NextRequest) {
  try {
    const { nome, descricao, polaridade, icone, visivel } = await req.json();
    const atributo = await prisma.atributo.create({
      data: { 
        nome, 
        descricao, 
        polaridade, 
        icone,
        visivel: visivel !== undefined ? visivel : true
      }
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar atributo' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/atributos
 * Atualiza um atributo existente (nome, descricao, polaridade, visibilidade).
 */
export async function PUT(req: NextRequest) {
  try {
    const { id, nome, descricao, polaridade, icone, visivel } = await req.json();
    const data: Record<string, unknown> = {};
    
    if (nome !== undefined) data.nome = nome;
    if (descricao !== undefined) data.descricao = descricao;
    if (polaridade !== undefined) data.polaridade = polaridade;
    if (icone !== undefined) data.icone = icone;
    if (visivel !== undefined) data.visivel = visivel;

    const atributo = await prisma.atributo.update({
      where: { id },
      data
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar atributo' }, { status: 500 });
  }
}
