'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Etapa1Props {
  userData: {
    nome: string;
    cidade: string;
    perfil: string[];
  };
  setUserData: React.Dispatch<React.SetStateAction<{ nome: string; cidade: string; perfil: string[] }>>;
  onNext: () => void;
  cidades: string[];
  perfis: string[];
}

export const Etapa1: React.FC<Etapa1Props> = ({ userData, setUserData, onNext, cidades, perfis }) => {
  const isComplete = userData.nome && userData.cidade && userData.perfil.length > 0;

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8 gap-8 overflow-y-auto pt-20 pb-20 no-scrollbar"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Identificação</h1>
        <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-3 font-bold">Personalize seu Pulso</p>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Como deseja ser chamado?</label>
          <input 
            type="text" 
            value={userData.nome}
            onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
            className="w-full bg-[#1c1814] border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757]/50 transition-all placeholder:text-[#7a6e64]/30"
            placeholder="Seu nome ou apelido"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Sua Localidade (MS)</label>
          <div className="relative">
            <select 
              value={userData.cidade}
              onChange={(e) => setUserData({ ...userData, cidade: e.target.value })}
              title="Selecione sua cidade"
              className="w-full bg-[#1c1814] border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757]/50 transition-all appearance-none text-[#f5f0e8] cursor-pointer"
            >
              <option value="" className="bg-[#141413]">Selecione sua cidade...</option>
              {cidades.map(c => <option key={c} value={c} className="bg-[#141413]">{c}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#d97757]">
              ↓
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest mb-6 text-center">Seu Perfil de Eleitor</p>
          <div className="flex flex-wrap justify-center gap-3">
            {perfis.map(p => {
              const isSelected = userData.perfil.includes(p);
              return (
                <motion.button 
                  key={p}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isSelected) {
                      setUserData({ ...userData, perfil: userData.perfil.filter(item => item !== p) });
                    } else if (userData.perfil.length < 3) {
                      setUserData({ ...userData, perfil: [...userData.perfil, p] });
                    }
                  }}
                  className={`relative px-5 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all ${
                    isSelected 
                      ? 'bg-[#d97757] text-[#f5f0e8] shadow-lg shadow-[#d97757]/20 border-[#d97757]' 
                      : 'bg-[#1c1814] border border-[#3d3128] text-[#7a6e64] hover:border-[#5a4535]'
                  }`}
                >
                  {p}
                </motion.button>
              );
            })}
          </div>
          <p className="text-[8px] text-center text-[#7a6e64] uppercase mt-4 opacity-70 tracking-widest">Até 3 características</p>
        </div>
      </div>

      <button 
        onClick={onNext}
        disabled={!isComplete}
        className={`mt-6 px-14 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
          isComplete
            ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_40px_rgba(217,119,87,0.3)] scale-100 hover:scale-105 active:scale-95' 
            : 'bg-[#1c1814] text-[#7a6e64] opacity-30 scale-95 cursor-not-allowed border border-[#3d3128]'
        }`}
      >
        Iniciar Experiência
      </button>
    </motion.div>
  );
};
