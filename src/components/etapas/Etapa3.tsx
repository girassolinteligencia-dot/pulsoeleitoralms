'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Etapa3Props {
  userData: {
    cidade: string;
    bairro: string;
  };
  setUserData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  cidades: string[];
}

export const Etapa3: React.FC<Etapa3Props> = ({ userData, setUserData, onNext, onBack, cidades }) => {
  const isComplete = userData.cidade && userData.bairro;

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-8 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          Localidade
        </h1>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-2 font-bold">
          Sua região no MS
        </p>
      </div>

      <div className="w-full max-w-[340px] flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Sua Cidade
          </label>
          <div className="relative">
            <select 
              value={userData.cidade}
              onChange={(e) => setUserData({ ...userData, cidade: e.target.value })}
              title="Selecione sua cidade"
              className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all appearance-none text-[#f5f0e8] cursor-pointer"
            >
              <option value="" className="bg-[#141413]">Selecione sua cidade...</option>
              {cidades.map(c => <option key={c} value={c} className="bg-[#141413]">{c}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#d97757] text-xs">
              ↓
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Seu Bairro
          </label>
          <input 
            type="text" 
            value={userData.bairro}
            onChange={(e) => setUserData({ ...userData, bairro: e.target.value })}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8]"
            placeholder="Digite seu bairro"
          />
        </div>
      </div>

      <div className="mt-auto pb-8 flex flex-col items-center gap-4 w-full">
        <button 
          onClick={() => onNext()}
          disabled={!isComplete}
          className={`w-full max-w-[300px] px-14 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
            isComplete
              ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_50px_rgba(217,119,87,0.4)] scale-100 opacity-100' 
              : 'bg-[#1c1814] text-[#7a6e64] opacity-20 scale-95 cursor-not-allowed border border-[#3d3128]'
          }`}
        >
          Avançar
        </button>
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
