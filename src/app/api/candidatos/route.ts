import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';
import { getFotoUrl } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();

  try {
    // Cidade/bairro informados pelo usuario sao variaveis do respondente.
    // A busca publica deve manter todos os candidatos ativos disponiveis.
    const scopeConfig = await getPublicScopeConfig();
    const candidatos = await prisma.candidato.findMany({
      where: buildPublicCandidateWhere(scopeConfig, {
        ...(search && {
          OR: [
            {
              nome: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              cargo: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              partido: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              cidade: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        }),
      }),
      orderBy: { nome: 'asc' },
      take: 50,
      select: {
        id: true,
        nome: true,
        partido: true,
        cargo: true,
        cidade: true,
        foto_url: true,
        status_verificacao: true,
        campanha: {
          select: {
            atributos: {
              select: {
                atributo: {
                  select: {
                    id: true,
                    nome: true,
                    polaridade: true
                  }
                }
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

    return NextResponse.json(
      candidatos.map((candidato) => {
        const nomeCompleto = candidato.nome;
        const idx = nomeCompleto.indexOf('(');
        const nomeUrna = idx > 0 ? nomeCompleto.slice(0, idx).trim() : nomeCompleto;
        return {
          ...candidato,
          foto_url: getFotoUrl(candidato.foto_url),
          nomeExibido: candidato.status_verificacao ? nomeCompleto : nomeUrna,
        };
      })
    );
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
