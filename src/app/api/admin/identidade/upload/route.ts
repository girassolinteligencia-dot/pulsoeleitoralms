import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAdminIdentity } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const MAX_SIZE = 512 * 1024;
const BUCKET = 'site';
const CHAVES_PERMITIDAS = [
  'geral_favicon_url',
  'geral_pwa_icone_url',
  'geral_og_imagem_url',
  'geral_patrocinio_imagem_url',
] as const;
type ChavePermitida = typeof CHAVES_PERMITIDAS[number];

const DESCRICOES: Record<ChavePermitida, string> = {
  geral_favicon_url: 'URL do favicon do site.',
  geral_pwa_icone_url: 'Ícone exibido ao instalar o site como app.',
  geral_og_imagem_url: 'URL da imagem Open Graph personalizada.',
  geral_patrocinio_imagem_url: 'Logo do patrocinador exibida nos banners da plataforma.',
};

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const chave = formData.get('chave') as string | null;

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    if (!chave || !CHAVES_PERMITIDAS.includes(chave as ChavePermitida)) {
      return NextResponse.json({ error: 'Chave inválida.' }, { status: 400 });
    }

    if (!['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(file.type)) {
      return NextResponse.json({ error: 'Formato não suportado. Use .webp, .png, .jpg, .svg ou .ico' }, { status: 422 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Arquivo muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 512 KB.` }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // SVG e ICO não passam pelo sharp — ficam no formato original
    const isBitmap = ['image/webp', 'image/png', 'image/jpeg'].includes(file.type);
    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    if (isBitmap) {
      buffer = await sharp(rawBuffer).webp({ quality: 90 }).toBuffer();
      contentType = 'image/webp';
      ext = 'webp';
    } else {
      buffer = rawBuffer;
      contentType = file.type;
      ext = file.name.split('.').pop() || 'bin';
    }

    const storagePath = `${chave}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      console.error('Erro upload Supabase Storage (site):', uploadError);
      return NextResponse.json({ error: 'Erro ao enviar para o storage. Verifique se o bucket "site" existe e é público.' }, { status: 500 });
    }

    const { data: publicUrl } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
    const url = publicUrl.publicUrl;

    await prisma.parametroPlataforma.upsert({
      where: { chave },
      update: { valor: url },
      create: { chave, valor: url, grupo: 'geral', descricao: DESCRICOES[chave as ChavePermitida] },
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Erro no upload de identidade:', error);
    return NextResponse.json({ error: 'Erro interno no upload.' }, { status: 500 });
  }
}
