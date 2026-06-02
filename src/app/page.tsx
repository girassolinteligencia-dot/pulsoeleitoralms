import { prisma } from '@/lib/prisma';
import LandingClient from '@/components/ui/LandingClient';

const DEFAULTS = {
  landing_titulo_linha1: 'Não é uma pesquisa.',
  landing_titulo_linha2: 'É o futuro de MS.',
  landing_subtitulo: 'PULSO ELEITORAL MS é a plataforma de inteligência e percepção pública do Mato Grosso do Sul. Um espaço seguro, projetado para que sua visão modele as Eleições de 2026.',
  landing_cta_principal: 'Expressar Minha Visão',
  landing_cta_secundario: 'Acesso Restrito',
};

export default async function LandingPage() {
  let textos = { ...DEFAULTS };

  try {
    const parametros = await prisma.parametroPlataforma.findMany({
      where: { chave: { startsWith: 'landing_' } },
    });
    for (const p of parametros) {
      if (p.chave in textos && p.valor) {
        textos[p.chave as keyof typeof textos] = p.valor as string;
      }
    }
  } catch {
    // usa DEFAULTS se banco falhar
  }

  return <LandingClient textos={textos} />;
}
