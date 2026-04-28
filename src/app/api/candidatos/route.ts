import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cidade = searchParams.get('cidade');
  const cargo = searchParams.get('cargo');
  const search = searchParams.get('search') || '';

  try {
    // Buscar ano ativo nos parâmetros da plataforma
    const paramAno = await prisma.parametroPlataforma.findUnique({
      where: { chave: 'geral_ano_pleito' }
    });
    const anoAtivo = paramAno ? (paramAno.valor as number) : 2024;

    const normalizedCargo = (cargo || '').toLowerCase().trim();
    const isCargoEstadual = ['governador', 'senador', 'deputado federal', 'deputado estadual', 'presidente'].includes(normalizedCargo);

    const candidatos = await prisma.candidato.findMany({
      where: {
        ano_eleicao: anoAtivo,
        ...(search && {
          nome: {
            contains: search,
            mode: 'insensitive'
          }
        }),
        ...(!isCargoEstadual && cidade && {
          OR: [
            {
              cidade: {
                equals: cidade,
                mode: 'insensitive'
              }
            },
            {
              cidade: {
                equals: 'MATO GROSSO DO SUL',
                mode: 'insensitive'
              }
            }
          ]
        }),
        ...(cargo && {
          cargo: {
            equals: cargo,
            mode: 'insensitive'
          }
        }),
      },
      include: {
        campanha: {
          include: {
            atributos: {
              include: {
                atributo: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(candidatos);
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
