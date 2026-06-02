import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdentity } from '@/lib/adminAuth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_SIZE = 100 * 1024; // 100 KB

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get('foto') as File | null;
    const candidatoId = formData.get('candidatoId') as string | null;

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    if (!candidatoId) return NextResponse.json({ error: 'candidatoId obrigatório.' }, { status: 400 });

    if (file.type !== 'image/webp') {
      return NextResponse.json({ error: 'Formato inválido. Envie um arquivo .webp.' }, { status: 422 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Arquivo muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 100 KB.` }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dir = path.join(process.cwd(), 'public', 'candidatos');
    await mkdir(dir, { recursive: true });

    const filename = `${candidatoId}.webp`;
    await writeFile(path.join(dir, filename), buffer);

    const foto_url = `/candidatos/${filename}`;
    return NextResponse.json({ foto_url });
  } catch (error) {
    console.error('Erro no upload de foto:', error);
    return NextResponse.json({ error: 'Erro interno no upload.' }, { status: 500 });
  }
}
