import Link from 'next/link';

const contactEmail = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL || 'privacidade@pulsoeleitoral.ms';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] px-6 py-12 md:py-16">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        <Link href="/" className="text-[10px] uppercase tracking-[0.3em] text-[#d97757] font-bold">
          Voltar
        </Link>

        <header className="flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#c8933a] font-bold">
            PULSO ELEITORAL MS
          </p>
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-sm text-[#b0aea5] leading-relaxed">
            Esta política explica, em linguagem simples, quais dados são usados na plataforma,
            para quais finalidades e como buscamos reduzir riscos de identificação individual.
          </p>
        </header>

        <section className="rounded-3xl border border-[#3d3128] bg-[#1c1814]/70 p-6 md:p-8 flex flex-col gap-5 text-sm text-[#d9d0c5] leading-relaxed">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Finalidade</h2>
          <p>
            A plataforma coleta manifestações espontâneas de percepção pública sobre candidatos,
            com finalidade estatística, metodológica e de inteligência territorial agregada. A
            participação não constitui pesquisa eleitoral registrada nem medição representativa
            de intenção de voto.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Dados Utilizados</h2>
          <p>
            A manifestação pode registrar cidade, bairro, UF, atributos escolhidos, aprovação,
            expectativa de vitória e respostas demográficas opcionais. O CEP informado é usado
            para localizar cidade/bairro e não é salvo na manifestação.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Dados Técnicos</h2>
          <p>
            Para segurança e prevenção de abuso, a plataforma mantém hashes técnicos de IP e
            fingerprint, user-agent e duração aproximada da sessão. Esses dados são usados para
            limitação de taxa, auditoria e bloqueio de uso automatizado.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Retenção</h2>
          <p>
            Dados técnicos e logs administrativos seguem janelas de retenção operacional. Perfis
            demográficos podem ser reduzidos após o prazo definido pela operação, preservando
            apenas informações agregáveis como cidade, bairro, UF e qualidade da origem territorial.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d97757]">Direitos e Contato</h2>
          <p>
            Solicitações relacionadas a privacidade, acesso, revisão ou eliminação devem ser
            encaminhadas para <a className="text-[#d97757] underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            Como a plataforma não pede nome, CPF ou e-mail no fluxo público, algumas solicitações
            podem depender de informações técnicas suficientes para localização segura do registro.
          </p>
        </section>

        <p className="text-[10px] text-[#7a6e64] leading-relaxed">
          Última atualização técnica: 20/05/2026. Este texto é uma política operacional da
          plataforma e deve ser revisado juridicamente antes de uso institucional definitivo.
        </p>
      </div>
    </main>
  );
}
