'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsDown, ThumbsUp } from 'lucide-react';

interface EtapaAprovacaoProps {
  onSelect: (aprovacao: boolean) => void;
  onBack: () => void;
  titulo?: string;
  pergunta?: string;
  labelSim?: string;
  labelNao?: string;
}

export const EtapaAprovacao: React.FC<EtapaAprovacaoProps> = ({
  onSelect,
  onBack,
  titulo = 'Postura Pública',
  pergunta = 'DE FORMA GERAL, VOCÊ APROVA OU DESAPROVA A IMAGEM DESTE CANDIDATO?',
  labelSim = 'Aprovo',
  labelNao = 'Desaprovo',
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
          className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 group transition-all hover:border-[#a8c47a]/50 hover:bg-[#a8c47a]/5"
        >
          <div className="w-20 h-20 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center group-hover:border-[#a8c47a] transition-all">
            <ThumbsUp size={34} className="text-[#a8c47a]" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.24em] sm:tracking-[0.3em] text-[#f5f0e8] group-hover:text-[#a8c47a] transition-colors">{labelSim}</span>
        </motion.button>

        <motion.button
          onClick={() => onSelect(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 group transition-all hover:border-[#d97757]/50 hover:bg-[#d97757]/5"
        >
          <div className="w-20 h-20 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center group-hover:border-[#d97757] transition-all">
            <ThumbsDown size={34} className="text-[#d97757]" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.24em] sm:tracking-[0.3em] text-[#f5f0e8] group-hover:text-[#d97757] transition-colors">{labelNao}</span>
        </motion.button>
      </div>

      <div className="mt-auto pb-12 flex flex-col items-center gap-4 w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.22em] sm:tracking-[0.3em] hover:text-[#f5f0e8] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar aos Atributos
        </button>
      </div>
    </motion.div>
  );
};
