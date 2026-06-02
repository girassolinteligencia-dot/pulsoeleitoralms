'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Pencil, Search } from 'lucide-react';
import { CandidatePhoto } from '@/components/ui/CandidatePhoto';

interface Candidato {
  id: string;
  nome: string;
  partido?: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
}

interface Etapa4Props {
  candidatos: Candidato[];
  onSelect: (cand: Candidato) => void;
  onBack: () => void;
  onEditRegion: () => void;
  onSearch: (query: string) => void;
  regionLabel?: string;
}

export const Etapa4: React.FC<Etapa4Props> = ({
  candidatos,
  onSelect,
  onBack,
  onEditRegion,
  onSearch,
  regionLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-4 sm:px-6 gap-5 sm:gap-6 overflow-y-auto pt-20 sm:pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0 max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          Busca
        </h1>
        <p className="text-[9px] sm:text-[10px] text-[#b0aea5] uppercase tracking-[0.28em] sm:tracking-[0.4em] mt-2 font-bold leading-relaxed">
          POLÍTICOS DISPONÍVEIS
        </p>
      </div>

      {regionLabel && (
        <div className="w-full max-w-xl flex items-center justify-between gap-3 rounded-xl border border-[#3d3128] bg-[#1c1814]/45 px-4 py-3">
          <div className="min-w-0 flex items-center gap-2 text-[#8d8177]">
            <MapPin size={14} className="shrink-0 text-[#c8933a]" />
            <span className="truncate text-[9px] font-bold uppercase tracking-[0.16em]">
              {regionLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onEditRegion}
            className="shrink-0 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#c8933a] hover:text-[#f5f0e8] transition-colors"
          >
            <Pencil size={12} />
            Corrigir
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="w-full max-w-xl flex flex-col gap-4">
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-xl px-5 py-4 sm:py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8] pr-12"
            placeholder="Nome do político..."
          />
          <button 
            type="submit"
            aria-label="Buscar político"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg text-[#d97757] hover:bg-[#d97757]/10 transition-colors flex items-center justify-center"
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      <div className="w-full max-w-xl flex flex-col gap-3 pb-10">
        {candidatos.length > 0 ? (
          candidatos.map((c) => (
            <motion.button 
              key={c.id}
              onClick={() => onSelect(c)}
              whileHover={{ x: 5, backgroundColor: '#1c1814' }}
              className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 group transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center overflow-hidden shrink-0">
                <CandidatePhoto src={c.foto_url} alt={c.nome} />
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1 gap-1">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#f5f0e8] group-hover:text-[#d97757] transition-colors leading-snug break-words">
                  {c.nome}
                </span>
              </div>
              <ArrowRight size={18} className="ml-auto text-[#d97757] opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </motion.button>
          ))
        ) : (
          <div className="text-center py-20 opacity-30">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Busque por um nome</p>
          </div>
        )}
      </div>

      <div className="mt-auto pb-8 flex flex-col items-center gap-4 w-full">
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.24em] hover:text-[#f5f0e8] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar ao perfil
        </button>
      </div>
    </motion.div>
  );
};
