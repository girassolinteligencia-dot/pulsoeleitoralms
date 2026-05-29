'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidatePhoto } from '@/components/ui/CandidatePhoto';

interface Atributo {
  id: string;
  nome: string;
  polaridade: number;
}

interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
  campanha?: {
    atributos: { atributo: Atributo }[];
  };
}

interface Etapa5Props {
  candidato: Candidato;
  evaluations: { atributoId: string; valor: number }[];
  onAttributeClick: (id: string, valor: number) => void;
  onNext: () => void;
  isSubmitting: boolean;
  parallax: { x: number; y: number };
  config?: {
    fluxo_limite_positivos?: number;
    fluxo_limite_negativos?: number;
    fluxo_minimo_selecao?: number;
    [key: string]: any;
  };
}

export const Etapa5: React.FC<Etapa5Props> = ({ 
  candidato, 
  evaluations, 
  onAttributeClick, 
  onNext, 
  isSubmitting,
  parallax,
  config
}) => {
  // Configurações do Painel Administrativo
  const minimoSelecao = config?.fluxo_minimo_selecao ?? 5;

  const [visibleAttributes] = React.useState<Atributo[]>(() => {
    const all = candidato.campanha?.atributos?.map(a => a.atributo) || [];
    // Mostra todos os atributos selecionados para o candidato, embaralhados aleatoriamente
    return [...all].sort(() => Math.random() - 0.5);
  });

  const totalVisivel = visibleAttributes.length;
  const canSubmit = evaluations.length >= minimoSelecao;
  const progresso = (evaluations.length / minimoSelecao) * 100;

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Glow */}
      <AnimatePresence>
        {evaluations.length > 0 && (
          <motion.div 
            key={evaluations.length}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-[#d97757] rounded-full blur-[120px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-3 px-4 sm:px-5 pt-16 pb-32">
        
        {/* Candidate Header — Compact */}
        <motion.div 
          className="flex items-center gap-4 w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Small Photo */}
          <motion.div 
            className="relative w-[48px] h-[48px] flex-shrink-0 rounded-full border-2 border-[#d97757] overflow-hidden shadow-[0_0_20px_rgba(217,119,87,0.2)] bg-[#1c1814]"
            style={{ x: parallax.x * 2, y: parallax.y * 2 }}
          >
            <CandidatePhoto src={candidato.foto_url} alt={candidato.nome} />
          </motion.div>

          {/* Candidate Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-sm font-bold font-display uppercase tracking-[0.1em] text-[#f5f0e8] truncate">
              {candidato.nome}
            </h2>
            <p className="text-[9px] text-[#b0aea5] font-body uppercase tracking-[0.16em] sm:tracking-[0.2em] mt-0.5 font-bold truncate">
              {candidato.cargo} · {candidato.cidade}
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#1c1814] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#d97757] to-[#c8933a] rounded-full"
            animate={{ width: `${Math.min(progresso, 100)}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        </div>
        <div className="w-full flex justify-between items-center gap-3 -mt-2">
          <p className="text-[8px] sm:text-[9px] text-[#7a6e64] uppercase tracking-[0.22em] sm:tracking-[0.4em] font-bold leading-relaxed">
            Associação de Perfil
          </p>
          <p className="text-[8px] sm:text-[9px] text-[#d97757] uppercase tracking-[0.22em] sm:tracking-[0.4em] font-bold text-right shrink-0">
            {evaluations.length} / {minimoSelecao} (Mínimo)
          </p>
        </div>

        {/* Instruction */}
        <motion.p 
          className="text-[10px] text-[#b0aea5] text-center font-body leading-tight mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Selecione <span className="text-[#f5f0e8] font-bold">{minimoSelecao}</span> ou mais características que você associa a este candidato.
        </motion.p>

        {/* Unified Attributes — No polarity division */}
        {visibleAttributes.length > 0 && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleAttributes.map((item, i) => {
                const isSelected = evaluations.some(e => e.atributoId === item.id);
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    onClick={() => onAttributeClick(item.id, item.polaridade)}
                    className={`
                      relative min-h-11 px-3 py-2 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.08em] font-display
                      transition-all duration-200 cursor-pointer select-none leading-snug break-words
                      ${isSelected 
                        ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_15px_rgba(217,119,87,0.3)] scale-95' 
                        : 'bg-[#1c1814] text-[#b0aea5] border border-[#3d3128] hover:border-[#d97757] hover:text-[#d97757] active:scale-95'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.span 
                        className="absolute top-0.5 right-1 text-[8px]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.span>
                    )}
                    {item.nome}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
        
        {totalVisivel === 0 && (
          <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-[#3d3128] rounded-3xl opacity-50">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#7a6e64]">Nenhum atributo disponível</span>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-t from-[#141413] via-[#141413]/95 to-transparent pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] px-4 sm:px-6 flex flex-col items-center gap-2">
        <button 
          onClick={onNext}
          disabled={!canSubmit || isSubmitting}
          className={`w-full max-w-md py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.18em] transition-all duration-500 font-display ${
            canSubmit 
              ? 'bg-gradient-to-r from-[#d97757] to-[#c8933a] text-[#f5f0e8] shadow-[0_0_30px_rgba(217,119,87,0.3)] hover:shadow-[0_0_50px_rgba(217,119,87,0.4)] active:scale-[0.98]' 
              : 'bg-[#1c1814] text-[#7a6e64] opacity-40 border border-[#3d3128] cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Ecoando...' : 'Prosseguir'}
        </button>

        <motion.p className="text-[7px] text-[#7a6e64] uppercase tracking-widest font-bold">
          {evaluations.length < minimoSelecao 
            ? `Selecione mais ${minimoSelecao - evaluations.length} para liberar` 
            : `${evaluations.length} selecionados`}
        </motion.p>
      </div>
    </motion.div>
  );
};
