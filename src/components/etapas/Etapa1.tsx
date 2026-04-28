'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Fragmento } from '../fragmento/Fragmento';

interface Etapa1Props {
  userData: {
    nome: string;
    ideologia: string;
  };
  setUserData: (data: any) => void;
  onNext: () => void;
  config?: any;
}

export const Etapa1: React.FC<Etapa1Props> = ({ userData, setUserData, onNext, config }) => {
  const ideologias = [
    { id: 'esquerda', label: 'Progressista', color: '#a8c47a' },
    { id: 'centro-esquerda', label: 'Centro-Esquerda', color: '#8fb88e' },
    { id: 'centro', label: 'Moderado', color: '#c8933a' },
    { id: 'centro-direita', label: 'Centro-Direita', color: '#d99d57' },
    { id: 'direita', label: 'Conservador', color: '#d97757' },
  ];

  const isComplete = userData.nome && userData.ideologia;

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-8 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {config?.onboarding_etapa1_titulo || 'Identificação'}
        </h1>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-3 font-bold drop-shadow-sm">
          Sincronize seu Perfil
        </p>
      </div>

      <div className="w-full max-w-[340px] flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Como deseja ser chamado?
          </label>
          <input 
            type="text" 
            value={userData.nome}
            onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8] shadow-inner"
            placeholder="Seu nome ou apelido"
          />
        </div>

        <div className="flex flex-col gap-6">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest text-center drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Sua Linha Ideológica
          </label>
          
          <div className="flex flex-col gap-3">
            {ideologias.map((item) => {
              const isSelected = userData.ideologia === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setUserData({ ...userData, ideologia: item.id })}
                  className={`group relative w-full py-4 px-6 rounded-2xl border transition-all duration-500 flex items-center justify-between ${
                    isSelected 
                      ? 'bg-[#1c1814] border-[#d97757] shadow-[0_0_20px_rgba(217,119,87,0.15)]' 
                      : 'bg-transparent border-[#3d3128] hover:border-[#7a6e64]'
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSelected ? 'text-[#f5f0e8]' : 'text-[#7a6e64] group-hover:text-[#b0aea5]'
                  }`}>
                    {item.label}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
                      style={{ color: item.color, backgroundColor: item.color }} 
                    />
                    {isSelected && (
                      <motion.div 
                        layoutId="check-ideology"
                        className="w-4 h-4 bg-[#d97757] rounded-full flex items-center justify-center text-[8px] text-white"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto pb-8">
        <button 
          onClick={() => onNext()}
          disabled={!isComplete}
          className={`relative z-50 px-14 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
            isComplete
              ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_50px_rgba(217,119,87,0.4)] scale-100 hover:scale-105 active:scale-95 cursor-pointer' 
              : 'bg-[#1c1814] text-[#7a6e64] opacity-20 scale-95 cursor-not-allowed border border-[#3d3128]'
          }`}
        >
          Avançar
        </button>
      </div>
    </motion.div>
  );
};
