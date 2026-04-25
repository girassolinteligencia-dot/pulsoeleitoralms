'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart } from '@/components/resultado/RadarChart';
import Image from 'next/image';

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

interface Etapa5Props {
  results: ResultData[];
  candidatoNome: string;
  onReset: () => void;
}

export const Etapa5: React.FC<Etapa5Props> = ({ results, candidatoNome, onReset }) => {
  const totalVozes = results.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Selo Girassol de Transparência */}
      <div className="absolute top-24 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20">
        <Image src="/gi/logo-32.png" alt="GI" width={20} height={20} />
        <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Auditoria Pública MS-2026</span>
      </div>

      <div className="text-center mb-10 mt-12">
        <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Inteligência da Voz</h2>
        <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.3em] font-bold mt-3">
          Percepção coletiva: <span className="text-[#d97757]">{candidatoNome}</span>
        </p>
      </div>

      {/* Radar Chart */}
      <div className="relative w-full max-w-[360px] aspect-square bg-[#1c1814]/40 backdrop-blur-xl rounded-[3rem] border border-[#3d3128] p-8 shadow-2xl">
        <RadarChart data={results} />
      </div>

      {/* Estatísticas de Engajamento */}
      <div className="mt-12 w-full max-w-[300px] flex flex-col gap-5">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold">
          <span className="text-[#7a6e64]">Engajamento Total</span>
          <span className="text-[#d97757]">{totalVozes} Vozes Registradas</span>
        </div>
        
        {/* Barra de Progresso Visual */}
        <div className="h-1.5 w-full bg-[#1c1814] rounded-full overflow-hidden border border-[#3d3128]">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#d97757] to-[#c8933a]" 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }} 
            transition={{ duration: 2, ease: 'circOut' }} 
          />
        </div>
      </div>

      {/* CTA Final */}
      <button 
        onClick={onReset} 
        className="mt-16 px-12 py-5 rounded-full bg-[#1c1814] text-[#f5f0e8] border border-[#3d3128] font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-[#241e18] hover:border-[#5a4535] transition-all shadow-xl"
      >
        Nova Avaliação
      </button>

      {/* Rodapé de Créditos */}
      <div className="absolute bottom-8 text-center opacity-30">
        <p className="text-[7px] uppercase font-bold tracking-[0.5em] text-[#7a6e64]">
          Desenvolvido por Girassol Inteligência
        </p>
      </div>
    </motion.div>
  );
};
