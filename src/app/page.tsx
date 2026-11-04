import LandingClient from '@/components/ui/LandingClient';
import { getDbAsync } from '@/server/db/client';
import { getParametrosPorPrefixo } from '@/server/repos/parametros';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  landing_titulo_linha1: 'Não é uma pesquisa.',
  landing_titulo_linha2: 'É o futuro de MS.',
  landing_subtitulo: 'PULSOMS.IA é a plataforma de inteligência e percepção pública de Mato Grosso do Sul. Avalie políticos, órgãos e serviços públicos — sua voz conta.',
  landing_cta_principal: 'Expressar Minha Visão',
};

export default async function LandingPage() {
  const textos = { ...DEFAULTS };
  try {
    const p = await getParametrosPorPrefixo(await getDbAsync(), ['landing_']);
    for (const [chave, valor] of p) {
      if (chave in textos && typeof valor === 'string' && valor) textos[chave as keyof typeof textos] = valor;
    }
  } catch {
    // usa DEFAULTS se o banco falhar
  }
  return <LandingClient textos={textos} />;
}
