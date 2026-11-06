'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cloud, Zap } from 'lucide-react';

interface EtapaExpectativaProps {
  onSelect: (expectativa: boolean) => void;
  onBack: () => void;
  titulo?: string;
  pergunta?: string;
  labelSim?: string;
  subLabelSim?: string;
  labelNao?: string;
  subLabelNao?: string;
}

export const EtapaExpectativa: React.FC<EtapaExpectativaProps> = ({
  onSelect,
  onBack,
  titulo = 'Poder de Vitória',
  pergunta = 'INDEPENDENTE DO SEU VOTO, VOCÊ ACREDITA QUE ESTE CANDIDATO TEM FORÇA PARA VENCER?',
  labelSim = 'Tem Força',
  subLabelSim = 'Percepção de Protagonismo',
  labelNao = 'Sem Força',
  subLabelNao = 'Percepção de Figurante',
}) => {
  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-4 sm:px-6 gap-6 sm:gap-8 overflow-y-auto pt-20 sm:pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {titulo}
        </h1>
        <p className="text-[9px] sm:text-[10px] text-[#b0aea5] uppercase tracking-[0.22em] sm:tracking-[0.4em] mt-2 font-bold max-w-sm mx-auto leading-relaxed">
          {pergunta}
        </p>
      </div>

      <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-8">
        <motion.button
          onClick={() => onSelect(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 group transition-all hover:border-[#c8933a]/50 hover:bg-[#c8933a]/5"
        >
          <div className="w-20 h-20 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center group-hover:border-[#c8933a] transition-all">
            <Zap size={34} className="text-[#c8933a]" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em] text-[#f5f0e8] group-hover:text-[#c8933a] transition-colors">{labelSim}</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#7a6e64] mt-1">{subLabelSim}</span>
          </div>
        </motion.button>

        <motion.button
          onClick={() => onSelect(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 group transition-all hover:border-[#7a6e64]/50 hover:bg-[#7a6e64]/5"
        >
          <div className="w-20 h-20 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center group-hover:border-[#f5f0e8] transition-all opacity-40">
            <Cloud size={34} className="text-[#f5f0e8]" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em] text-[#f5f0e8] opacity-60 transition-colors group-hover:opacity-100">{labelNao}</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#7a6e64] mt-1">{subLabelNao}</span>
          </div>
        </motion.button>
      </div>

      <div className="mt-auto pb-12 flex flex-col items-center gap-4 w-full">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.22em] sm:tracking-[0.3em] hover:text-[#f5f0e8] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar à Aprovação
        </button>
      </div>
    </motion.div>
  );
};
