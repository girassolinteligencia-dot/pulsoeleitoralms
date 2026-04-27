import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all candidates for admin
export async function GET(req: NextRequest) {
  try {
    const candidatos = await prisma.candidato.findMany({
      include: {
        campanha: true
      },
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(candidatos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
