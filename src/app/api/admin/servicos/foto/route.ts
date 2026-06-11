import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdentity } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const MAX_SIZE = 300 * 1024;
const BUCKET = 'servicos';

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get('foto') as File | null;
    const servicoId = formData.get('servicoId') as string | null;

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    if (!servicoId) return NextResponse.json({ error: 'servicoId obrigatório.' }, { status: 400 });

    if (file.type !== 'image/webp') {
      return NextResponse.json({ error: 'Apenas .webp é aceito.' }, { status: 422 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Arquivo muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 300 KB.` }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `${servicoId}.webp`;

    const supabaseAdmin = getSupabaseAdmin();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      console.error('Erro upload Supabase Storage (servicos):', uploadError);
      return NextResponse.json({ error: 'Erro ao enviar imagem para o storage.' }, { status: 500 });
    }

    const foto_url = `servicos/${storagePath}`;

    await prisma.servicoPublico.update({
      where: { id: servicoId },
      data: { foto_url },
    });

    return NextResponse.json({ foto_url });
  } catch (error) {
    console.error('Erro no upload de logo de serviço:', error);
    return NextResponse.json({ error: 'Erro interno no upload.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const servicoId = searchParams.get('servicoId');
  if (!servicoId) return NextResponse.json({ error: 'servicoId obrigatório.' }, { status: 400 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.storage.from(BUCKET).remove([`${servicoId}.webp`]);
    await prisma.servicoPublico.update({ where: { id: servicoId }, data: { foto_url: null } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao remover foto de serviço:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
