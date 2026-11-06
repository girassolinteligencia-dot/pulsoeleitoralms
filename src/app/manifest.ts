import type { MetadataRoute } from 'next';
import { getDbAsync } from '@/server/db/client';
import { asString, getParametros } from '@/server/repos/parametros';
import { getFotoUrl } from '@/lib/fotoUrl';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let iconUrl = '/favicon.webp';
  try {
    const p = await getParametros(await getDbAsync(), ['geral_pwa_icone_url']);
    iconUrl = getFotoUrl(asString(p.get('geral_pwa_icone_url'))) || iconUrl;
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
