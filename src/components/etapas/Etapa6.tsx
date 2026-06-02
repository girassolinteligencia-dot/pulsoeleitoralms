'use client';

import React from 'react';
import { motion } from 'framer-motion';
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

interface Etapa6Props {
  results: ResultData[];
  advancedResults: any;
  candidatoNome: string;
  candidatoFotoUrl?: string | null;
  onReset: () => void;
}

export const Etapa6: React.FC<Etapa6Props> = ({
  results,
  advancedResults,
  candidatoNome,
  candidatoFotoUrl,
  onReset,
}) => {
  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center pt-16 px-3 overflow-y-auto pb-safe no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20 mb-5">
        <Image src="/gi/logo-32.png" alt="GI" width={16} height={16} />
        <span className="text-[#c8933a] text-[7px] font-bold uppercase tracking-widest">Percepção Pública MS</span>
      </div>

      <div className="text-center mb-4 shrink-0 w-full max-w-md">
        <h2 className="text-xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          Inteligência do Pulso
        </h2>
      </div>

      <section className="w-full max-w-md mb-5 bg-[#1c1814]/60 border border-[#3d3128] rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="w-[64px] h-[84px] rounded-lg overflow-hidden border border-[#d97757]/30 bg-[#141413] shrink-0 shadow-[0_0_24px_rgba(217,119,87,0.12)]">
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

      <div className="w-full mb-8 max-w-md">
        <PercepcaoDashboard data={advancedResults} />
      </div>

      <div className="mt-auto pt-4 pb-10 w-full flex flex-col items-center gap-6">
        <motion.button 
          onClick={onReset} 
          className="w-full max-w-[240px] py-4 rounded-full bg-[#1c1814] text-[#f5f0e8] border border-[#3d3128] font-bold text-[9px] uppercase tracking-[0.32em] transition-all shadow-xl hover:border-[#d97757]"
        >
          Nova Manifestação
        </motion.button>

        <div className="opacity-40">
          <p className="text-[7px] uppercase font-bold tracking-[0.5em] text-[#7a6e64]">
            Girassol Inteligência
          </p>
        </div>
      </div>
    </motion.div>
  );
};
