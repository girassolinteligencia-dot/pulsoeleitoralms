import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cidade = searchParams.get('cidade');
  const cargo = searchParams.get('cargo');

  try {
    // Para cargos estaduais/federais, a cidade no banco é 'MATO GROSSO DO SUL'
    // Então não devemos filtrar pela cidade selecionada pelo usuário nesses casos
    const normalizedCargo = (cargo || '').toLowerCase().trim();
    const isCargoEstadual = ['governador', 'senador', 'deputado federal', 'deputado estadual', 'presidente'].includes(normalizedCargo);

    const candidatos = await prisma.candidato.findMany({
      where: {
        ...(!isCargoEstadual && cidade && {
          cidade: {
            equals: cidade,
            mode: 'insensitive'
          }
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
