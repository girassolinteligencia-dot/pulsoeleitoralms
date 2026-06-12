import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let iconUrl = '/favicon.webp';
  try {
    const param = await prisma.parametroPlataforma.findUnique({
      where: { chave: 'geral_pwa_icone_url' },
    });
    if (param?.valor && typeof param.valor === 'string') {
      iconUrl = param.valor;
    }
  } catch {
    // fallback ao favicon padrão
  }

  return {
    name: 'PULSOMS.IA',
    short_name: 'PulsoMS',
    description: 'Percepção pública de Mato Grosso do Sul',
    start_url: '/',
    display: 'standalone',
    background_color: '#141413',
    theme_color: '#d97757',
    icons: [
      { src: iconUrl, sizes: '192x192', type: 'image/webp' },
      { src: iconUrl, sizes: '512x512', type: 'image/webp' },
    ],
  };
}
