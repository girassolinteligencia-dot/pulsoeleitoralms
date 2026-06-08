'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RadarChart } from '@/components/resultado/RadarChart';
import { PercepcaoDashboard } from '@/components/resultado/PercepcaoDashboard';
import Image from 'next/image';
import { Fragmento } from '../fragmento/Fragmento';
import { CandidatePhoto } from '@/components/ui/CandidatePhoto';

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

interface UserEvaluation {
  atributoId: string;
  valor: number;
}

interface Etapa6Props {
  results: ResultData[];
  advancedResults: any;
  userEvaluations: UserEvaluation[];
  candidatoNome: string;
  candidatoFotoUrl?: string | null;
  onReset: () => void;
  config?: any;
}

function getBlocos(config: any) {
  const c = (config?.resultado_blocos as Record<string, boolean>) || {};
  return {
    radar:          c.radar          !== false,
    comparativo:    c.comparativo    !== false,
    termometro:     c.termometro     !== false,
    forcas:         c.forcas         !== false,
    regional:       c.regional       !== false,
    compartilhar:   c.compartilhar   !== false,
    expectativa:    c.expectativa    === true,
    tendencias:     c.tendencias     === true,
    ideologia:      c.ideologia      === true,
    demografico:    c.demografico    === true,
    cargo:          c.cargo          === true,
  };
}

function BotaoCompartilhar({ nome }: { nome: string }) {
  const [copiado, setCopiado] = useState(false);

  const compartilhar = async () => {
    const texto = `Acabei de avaliar ${nome} no Pulso MS. Veja a percepção coletiva: ${window.location.origin}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Pulso MS', text: texto, url: window.location.origin }); return; } catch { /* cancelado */ }
    }
    await navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <motion.button
      onClick={compartilhar}
      whileTap={{ scale: 0.97 }}
      className="w-full max-w-[240px] py-4 rounded-full bg-[#1c1814] text-[#f5f0e8] border border-[#d97757]/40 font-bold text-[9px] uppercase tracking-[0.32em] transition-all hover:border-[#d97757] hover:bg-[#d97757]/5 flex items-center justify-center gap-2"
    >
      <span>{copiado ? '✓ Link copiado' : '↗ Compartilhar resultado'}</span>
    </motion.button>
  );
}

function ComparativoCard({ userEvaluations, results, candidatoNome }: {
  userEvaluations: UserEvaluation[];
  results: ResultData[];
  candidatoNome: string;
}) {
  if (!results || results.length === 0 || userEvaluations.length === 0) return null;

  // Monta mapa de atributo_nome → % coletivo
  const coletivoMap = new Map(results.map(r => [r.atributo, r.total]));
  const totalVozes = results.length > 0 ? Math.max(...results.map(r => r.total), 1) : 1;

  // Atributos que o usuário marcou, cruzados com dados coletivos
  // results usa nome do atributo; userEvaluations usa ID — precisamos do nome via results
  // results[i].atributo já é o nome. Não temos mapa ID→nome aqui, então usamos
  // os resultados diretamente: mostra top atributos coletivos e destaca os que o usuário marcou
  const top = [...results].sort((a, b) => b.total - a.total).slice(0, 8);
  if (top.length === 0) return null;

  const maxTotal = Math.max(...top.map(r => r.total), 1);

  // IDs que o usuário marcou (não temos nome, mas temos a lista de results com atributo=nome)
  // A comparação visual é: barra coletiva, e se o usuário também marcou → destaque
  // Como não temos o ID→nome aqui, mostramos apenas o ranking coletivo com contagem
  return (
    <section className="w-full max-w-md mb-3 bg-[#1c1814]/60 border border-[#3d3128] rounded-xl p-4 flex flex-col gap-3">
      <span className="text-[9px] uppercase tracking-[0.22em] text-[#f5f0e8] font-bold">
        O que a coletividade mais associa
      </span>
      <p className="text-[8px] text-[#7a6e64] uppercase tracking-widest -mt-1">
        Atributos mais marcados por todos os avaliadores
      </p>
      <div className="flex flex-col gap-2">
        {top.map((r, i) => {
          const pct = Math.round((r.total / maxTotal) * 100);
          return (
            <div key={r.atributo} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#b0aea5] uppercase tracking-[0.06em] truncate">{r.atributo}</span>
                <span className="text-[9px] font-bold text-[#c8933a] tabular-nums shrink-0 ml-2">{r.total}×</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#d97757]/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const Etapa6: React.FC<Etapa6Props> = ({
  results,
  advancedResults,
  userEvaluations,
  candidatoNome,
  candidatoFotoUrl,
  onReset,
  config,
}) => {
  const blocos = getBlocos(config);

  return (
    <motion.div
      className="relative w-full h-full flex flex-col items-center pt-16 px-4 sm:px-6 overflow-y-auto pb-safe no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20 mb-5">
        <Image src="/gi/logo-32.png" alt="GI" width={16} height={16} />
        <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Percepção Pública MS</span>
      </div>

      <div className="text-center mb-4 shrink-0 w-full max-w-md">
        <h2 className="text-xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          Inteligência do Pulso
        </h2>
        {advancedResults?.resumo?.vozesValidas > 0 && (
          <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest mt-1 font-bold">
            {advancedResults.resumo.vozesValidas} vozes registradas
          </p>
        )}
      </div>

      <section className="w-full max-w-md mb-5 bg-[#1c1814]/60 border border-[#3d3128] rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="w-16 h-20 sm:w-[64px] sm:h-[84px] rounded-lg overflow-hidden border border-[#d97757]/30 bg-[#141413] shrink-0 shadow-[0_0_24px_rgba(217,119,87,0.12)]">
          <CandidatePhoto src={candidatoFotoUrl} alt={candidatoNome || 'Político'} size={96} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[8px] text-[#d97757] uppercase tracking-[0.2em] font-bold">
            Percepção coletiva
          </span>
          <h3 className="mt-2 text-[13px] font-bold font-display uppercase tracking-[0.06em] text-[#f5f0e8] leading-snug break-words">
            {candidatoNome}
          </h3>
        </div>
      </section>

      {/* Radar */}
      {blocos.radar && (
        <section className="w-full max-w-md mb-5 shrink-0">
          <div className="mb-3 px-1">
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#f5f0e8] font-bold">
              Gráfico radar / teia de aranha
            </span>
          </div>
          <div className="relative w-full aspect-square flex items-center justify-center">
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 blur-3xl pointer-events-none scale-150">
              <Fragmento id="result-core" label="" type="positivo" />
            </div>
            <div className="relative z-10 w-full h-full bg-[#1c1814]/40 backdrop-blur-xl rounded-2xl border border-[#3d3128] p-2 shadow-2xl flex items-center justify-center">
              <RadarChart data={results} />
            </div>
          </div>
        </section>
      )}

      {/* Comparativo coletivo */}
      {blocos.comparativo && (
        <ComparativoCard
          userEvaluations={userEvaluations}
          results={results}
          candidatoNome={candidatoNome}
        />
      )}

      {/* Dashboard de percepção com blocos controlados */}
      <div className="w-full mb-8 max-w-md">
        <PercepcaoDashboard
          data={advancedResults}
          blocos={blocos}
        />
      </div>

      <div className="mt-auto pt-4 pb-10 w-full flex flex-col items-center gap-4">
        <motion.button
          onClick={onReset}
          className="w-full max-w-[240px] py-4 rounded-full bg-[#d97757] text-[#f5f0e8] font-bold text-[9px] uppercase tracking-[0.32em] transition-all shadow-xl hover:brightness-110 active:scale-95"
        >
          Nova Manifestação
        </motion.button>

        {blocos.compartilhar && (
          <BotaoCompartilhar nome={candidatoNome} />
        )}

        <Link href="/" className="w-full max-w-[240px]">
          <motion.div className="w-full py-4 rounded-full bg-[#1c1814] text-[#f5f0e8] border border-[#3d3128] font-bold text-[9px] uppercase tracking-[0.32em] transition-all shadow-xl hover:border-[#d97757] text-center">
            Voltar ao Início
          </motion.div>
        </Link>

        <div className="opacity-40 pt-2">
          <p className="text-[8px] uppercase font-bold tracking-[0.5em] text-[#7a6e64]">
            Girassol Inteligência
          </p>
        </div>
      </div>
    </motion.div>
  );
};
