'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart } from '@/components/resultado/RadarChart';
import Image from 'next/image';
import { Fragmento } from '../fragmento/Fragmento';

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

interface Etapa6Props {
  results: ResultData[];
  candidatoNome: string;
  onReset: () => void;
}

export const Etapa6: React.FC<Etapa6Props> = ({ results, candidatoNome, onReset }) => {
  const totalVozes = results.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center pt-20 px-6 overflow-y-auto pb-safe no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20 mb-8">
        <Image src="/gi/logo-32.png" alt="GI" width={16} height={16} />
        <span className="text-[#c8933a] text-[7px] font-bold uppercase tracking-widest">Auditoria Pública MS-2026</span>
      </div>

      <div className="text-center mb-8 shrink-0">
        <h2 className="text-xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">Inteligência da Voz</h2>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.3em] font-bold mt-2 leading-relaxed">
          Percepção coletiva: <br/>
          <span className="text-[#d97757]">{candidatoNome}</span>
        </p>
      </div>

      <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center shrink-0">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 blur-2xl pointer-events-none scale-125">
          <Fragmento id="result-core" label="" type="positivo" />
        </div>
        
        <div className="relative z-10 w-full h-full bg-[#1c1814]/40 backdrop-blur-xl rounded-[2.5rem] border border-[#3d3128] p-6 shadow-xl flex items-center justify-center overflow-hidden">
          <RadarChart data={results} />
        </div>
      </div>

      <motion.div 
        className="mt-8 w-full max-w-[280px] flex flex-col gap-4 shrink-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-[#7a6e64] uppercase tracking-[0.4em] font-bold">Engajamento</span>
            <span className="text-xl font-bold font-display text-[#f5f0e8] tabular-nums">{totalVozes.toLocaleString()}</span>
          </div>
          <span className="text-[9px] text-[#d97757] font-bold uppercase tracking-widest pb-1">Vozes Ativas</span>
        </div>
        
        <div className="h-1.5 w-full bg-[#1c1814] rounded-full overflow-hidden border border-[#3d3128]/50 shadow-[0_0_10px_rgba(217,119,87,0.1)]">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#d97757] via-[#c8933a] to-[#d97757] bg-[length:200%_100%]" 
            initial={{ width: 0 }} 
            animate={{ width: '100%', backgroundPosition: ['0% 0%', '100% 0%'] }} 
            transition={{ 
              width: { duration: 1.5, ease: 'circOut' },
              backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' }
            }} 
          />
        </div>
      </motion.div>

      <div className="mt-auto pt-8 pb-12 w-full flex flex-col items-center gap-6">
        <motion.button 
          onClick={onReset} 
          className="w-full max-w-[240px] py-5 rounded-full bg-[#1c1814] text-[#f5f0e8] border border-[#3d3128] font-bold text-[9px] uppercase tracking-[0.5em] transition-all shadow-xl hover:border-[#d97757]"
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
