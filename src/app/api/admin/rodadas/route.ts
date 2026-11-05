import { NextRequest, NextResponse } from 'next/server';
import { and, count, desc, eq, like, ne } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { campanhas, rodadasMetodologicas as rodadas } from '@/server/db/schema';
import { getAdminIdentityWithRole, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

const TIPOS_PERMITIDOS = new Set(['percepcao_espontanea', 'pesquisa_registravel']);
const STATUS_PERMITIDOS = new Set(['rascunho', 'ativa', 'encerrada', 'arquivada']);

function parseOptionalDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeJson(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildRodadaData(body: Record<string, unknown>) {
  const tipo = typeof body.tipo === 'string' && TIPOS_PERMITIDOS.has(body.tipo)
    ? body.tipo
    : 'percepcao_espontanea';

  const status = typeof body.status === 'string' && STATUS_PERMITIDOS.has(body.status)
    ? body.status
    : 'rascunho';

  return {
    titulo: String(body.titulo || '').trim(),
    tipo,
    status,
    campanha_id: typeof body.campanha_id === 'string' && body.campanha_id ? body.campanha_id : null,
    objetivo: typeof body.objetivo === 'string' ? body.objetivo : null,
    publico_alvo: typeof body.publico_alvo === 'string' ? body.publico_alvo : null,
    abrangencia: typeof body.abrangencia === 'string' ? body.abrangencia : null,
    tamanho_amostra: normalizeOptionalNumber(body.tamanho_amostra),
    margem_erro: normalizeOptionalNumber(body.margem_erro),
    nivel_confianca: normalizeOptionalNumber(body.nivel_confianca),
    periodo_inicio: parseOptionalDate(body.periodo_inicio),
    periodo_fim: parseOptionalDate(body.periodo_fim),
    plano_amostral: normalizeJson(body.plano_amostral),
    ponderacao: normalizeJson(body.ponderacao),
    questionario: normalizeJson(body.questionario),
    observacoes: typeof body.observacoes === 'string' ? body.observacoes : null,
  };
}

function hasMethodContent(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function validateRodadaGovernance(data: ReturnType<typeof buildRodadaData>) {
  const errors: string[] = [];

  if (data.periodo_inicio && data.periodo_fim && data.periodo_inicio > data.periodo_fim) {
    errors.push('A data de início não pode ser posterior à data de fim.');
  }

  if (data.status === 'ativa') {
    if (!data.campanha_id) errors.push('Rodada ativa precisa estar vinculada a uma campanha.');
    if (!data.objetivo?.trim()) errors.push('Rodada ativa precisa ter objetivo metodológico.');
    if (!data.periodo_inicio) errors.push('Rodada ativa precisa ter data de início de campo.');
  }

  if (data.status === 'encerrada' && !data.periodo_fim) {
    errors.push('Rodada encerrada precisa ter data de fim de campo.');
  }

  if (data.tipo === 'pesquisa_registravel' && ['ativa', 'encerrada'].includes(data.status)) {
    if (!data.tamanho_amostra) errors.push('Pesquisa registrável ativa/encerrada precisa ter tamanho de amostra.');
    if (!data.margem_erro) errors.push('Pesquisa registrável ativa/encerrada precisa ter margem de erro.');
    if (!data.nivel_confianca) errors.push('Pesquisa registrável ativa/encerrada precisa ter nível de confiança.');
    if (!hasMethodContent(data.plano_amostral)) errors.push('Pesquisa registrável ativa/encerrada precisa ter plano amostral.');
    if (!hasMethodContent(data.questionario)) errors.push('Pesquisa registrável ativa/encerrada precisa ter questionário.');
  }

  return errors;
}

async function findConflictingActiveRodada(campanhaId: string | null, ignoreId?: string) {
  if (!campanhaId) return null;

  const [r] = await getDb()
    .select({ id: rodadas.id, titulo: rodadas.titulo })
    .from(rodadas)
    .where(and(eq(rodadas.campanha_id, campanhaId), eq(rodadas.status, 'ativa'), ignoreId ? ne(rodadas.id, ignoreId) : undefined))
    .limit(1);
  return r ?? null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const tipo = searchParams.get('tipo') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const busca = search.trim().replace(/[%_]/g, '');
    const where = and(
      tipo && TIPOS_PERMITIDOS.has(tipo) ? eq(rodadas.tipo, tipo) : undefined,
      status && STATUS_PERMITIDOS.has(status) ? eq(rodadas.status, status) : undefined,
      busca ? like(rodadas.titulo, `%${busca}%`) : undefined,
    );
    const db = getDb();
    const [rows, [tot]] = await Promise.all([
      db
        .select({ r: rodadas, campanha: { id: campanhas.id, nome: campanhas.nome, slug: campanhas.slug } })
        .from(rodadas)
        .leftJoin(campanhas, eq(campanhas.id, rodadas.campanha_id))
        .where(where)
        .orderBy(desc(rodadas.criado_em))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ n: count() }).from(rodadas).where(where),
    ]);
    const lista = rows.map(({ r, campanha }) => ({ ...r, campanha: campanha?.id ? campanha : null }));
    const total = tot?.n ?? 0;

    return NextResponse.json({
      data: lista,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar rodadas metodológicas:', error);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin', 'editor']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const data = buildRodadaData(body);

    if (!data.titulo) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const governanceErrors = validateRodadaGovernance(data);
    if (governanceErrors.length > 0) {
      return NextResponse.json({ error: 'Governança metodológica inválida', details: governanceErrors }, { status: 400 });
    }

    const conflict = await findConflictingActiveRodada(data.status === 'ativa' ? data.campanha_id : null);
    if (conflict) {
      return NextResponse.json({
        error: `Já existe rodada ativa para esta campanha: ${conflict.titulo}`,
      }, { status: 409 });
    }

    const [rodada] = await getDb().insert(rodadas).values(data).returning();
    await recordAuditLog({
      admin: auth,
      acao: 'RODADA_CRIADA',
      entidade: 'RodadaMetodologica',
      entidadeId: rodada.id,
      detalhes: {
        titulo: rodada.titulo,
        tipo: rodada.tipo,
        status: rodada.status,
        campanha_id: rodada.campanha_id,
      },
    });

    return NextResponse.json(rodada);
  } catch (error) {
    console.error('Erro ao criar rodada metodológica:', error);
    return NextResponse.json({ error: 'Erro interno ao criar rodada' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin', 'editor']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id : '';

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const [current] = await getDb().select().from(rodadas).where(eq(rodadas.id, id)).limit(1);
    if (!current) {
      return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 });
    }

    const data = buildRodadaData(body);

    if (!data.titulo) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (['encerrada', 'arquivada'].includes(current.status) && data.status !== 'arquivada') {
      return NextResponse.json({
        error: 'Rodadas encerradas ou arquivadas ficam travadas. Só é permitido arquivar uma rodada encerrada.',
      }, { status: 409 });
    }

    const governanceErrors = validateRodadaGovernance(data);
    if (governanceErrors.length > 0) {
      return NextResponse.json({ error: 'Governança metodológica inválida', details: governanceErrors }, { status: 400 });
    }

    const conflict = await findConflictingActiveRodada(data.status === 'ativa' ? data.campanha_id : null, id);
    if (conflict) {
      return NextResponse.json({
        error: `Já existe rodada ativa para esta campanha: ${conflict.titulo}`,
      }, { status: 409 });
    }

    const [rodada] = await getDb().update(rodadas).set(data).where(eq(rodadas.id, id)).returning();
    await recordAuditLog({
      admin: auth,
      acao: 'RODADA_ATUALIZADA',
      entidade: 'RodadaMetodologica',
      entidadeId: rodada.id,
      detalhes: {
        titulo: rodada.titulo,
        tipo: rodada.tipo,
        status: rodada.status,
        campanha_id: rodada.campanha_id,
        status_anterior: current.status,
      },
    });

    return NextResponse.json(rodada);
  } catch (error) {
    console.error('Erro ao atualizar rodada metodológica:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar rodada' }, { status: 500 });
  }
}
