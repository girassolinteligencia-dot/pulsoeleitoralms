import Link from 'next/link';

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] px-6 py-12 md:py-16">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        <Link href="/" className="text-[10px] uppercase tracking-[0.3em] text-[#d97757] font-bold">
          Voltar
        </Link>

        <header className="flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#c8933a] font-bold">
            PULSOMS.IA
          </p>
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-sm text-[#b0aea5] leading-relaxed">
            Estes termos definem as condições básicas para participação na plataforma.
          </p>
        </header>

        <section className="rounded-3xl border border-[#3d3128] bg-[#1c1814]/70 p-6 md:p-8 flex flex-col gap-5 text-sm text-[#d9d0c5] leading-relaxed">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Natureza da Plataforma</h2>
          <p>
            O PULSOMS.IA é uma plataforma de manifestação espontânea de percepção pública sobre
            agentes e entidades públicas. Os resultados exibidos representam interações registradas
            no sistema e não substituem pesquisa registrada, avaliação institucional ou auditoria
            de serviços públicos.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Participação</h2>
          <p>
            Ao participar, o usuário declara que fornecerá informações de boa-fé e não tentará
            automatizar, fraudar, manipular ou sobrecarregar a plataforma. Registros suspeitos
            podem ser invalidados ou bloqueados por critérios técnicos.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Uso dos Resultados</h2>
          <p>
            Indicadores públicos devem ser interpretados como percepção coletiva da base
            participante. Qualquer comunicação externa deve preservar essa distinção metodológica
            e evitar afirmações de representatividade eleitoral.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Disponibilidade</h2>
          <p>
            A plataforma pode passar por manutenção, ajustes metodológicos, auditoria de segurança
            ou interrupções técnicas. A operação poderá alterar escopos de campanha e rodadas
            metodológicas para preservar qualidade e segurança.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Privacidade</h2>
          <p>
            O tratamento de dados segue a política de privacidade da plataforma. O CEP informado
            é usado para localizar região e não é salvo na manifestação pública.
          </p>
        </section>

        <p className="text-[10px] text-[#7a6e64] leading-relaxed">
          Última atualização técnica: 20/05/2026. Estes termos devem ser revisados juridicamente
          antes de uso institucional definitivo.
        </p>
      </div>
    </main>
  );
}
