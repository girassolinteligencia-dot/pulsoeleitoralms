'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
}

interface Etapa4Props {
  candidatos: Candidato[];
  onSelect: (cand: Candidato) => void;
  onBack: () => void;
  onSearch: (query: string) => void;
}

export const Etapa4: React.FC<Etapa4Props> = ({ candidatos, onSelect, onBack, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-6 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          Busca
        </h1>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-2 font-bold">
          CANDIDATOS DISPONÍVEIS
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-[340px] flex flex-col gap-4">
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8] pr-12"
            placeholder="Nome do candidato..."
          />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d97757] hover:scale-110 transition-transform"
          >
            🔍
          </button>
        </div>
      </form>

      <div className="w-full max-w-[340px] flex flex-col gap-3 pb-10">
        {candidatos.length > 0 ? (
          candidatos.map((c) => (
            <motion.button 
              key={c.id}
              onClick={() => onSelect(c)}
              whileHover={{ x: 5, backgroundColor: '#1c1814' }}
              className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-2xl p-4 flex items-center gap-4 group transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center overflow-hidden shrink-0">
                {c.foto_url ? (
                  <img src={c.foto_url} alt={c.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg opacity-30">👤</span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#f5f0e8] group-hover:text-[#d97757] transition-colors">{c.nome}</span>
                <span className="text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">{c.cargo}</span>
              </div>
              <span className="ml-auto text-[#d97757] opacity-0 group-hover:opacity-100 transition-all">→</span>
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
          className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.3em] hover:text-[#f5f0e8] transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
};
