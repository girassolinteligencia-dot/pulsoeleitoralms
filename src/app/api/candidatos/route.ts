import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    // Query de candidatos restrita aos anos de 2022 e 2024

    const candidatos = await prisma.candidato.findMany({
      where: {
        ano_eleicao: {
          in: [2022, 2024]
        },
        ...(search && {
          nome: {
            contains: search,
            mode: 'insensitive'
          }
        }),
      },
      take: 50,
      include: {
        campanha: {
          include: {
            atributos: {
              include: {
                atributo: true
              },
              where: {
                atributo: {
                  visivel: true
                }
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
